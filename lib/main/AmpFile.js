/**
 * @file File class to hold pertinent data about an optimization target file
 * @version 0.1
 */

const tags = require('../utils/tags');
const DomParser = require("../interfaces/DomParser");
const fs = require('fs');
const {performance} = require('perf_hooks');
const postcss = require('postcss')

/**
 *
 */
class AmpFile {

  /**
   * @param {string} file
   */
  constructor(file){
    const fileParts = file.split('/');
    this.file = file;
    this.fileName = fileParts.pop();
    this.fileDir = fileParts.join('/');
    if(file !== 'test' ) {
      this._prepFile();
    }

    /**
     * @description Holds all optimization statistics for later reporting.
     * @type {
     *    {fileName: string,
     *    status: string,
     *    inputSize: number,
     *    outputSize: number,
     *    startTime: number,
     *    endTime: number,
     *    selectorsRemoved: number}}
     * @private
     */
    this._stats = {
      fileName: this.fileName,
      status: "running",
      inputSize: 0,
      outputSize: 0,
      startTime: performance.now(),
      endTime: 0,
      selectorsRemoved: 0
    };
  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Object} Static DOM representation of file HTML.
   */
  _prepFile() {
    /**
     * @type {* | {
     *    dom: (* | Function | jQuery | HTMLElement),
     *    ampElementSelectors: Set<string>,
     *    attributeSelectors: Set<string>,
     *    classSelectors: Set<string>,
     *    elementSelectors: Set<string>,
     *    emptySelectors: Set<any>,
     *    idSelectors: Set<string>,
     *    joinedRawCss: string,
     *    nestedSelectors: Set<string>,
     *    exceptionElementTags: (* | Set<string>)}}
     */
    let fileMetadata = DomParser.extractDomData(this.file);

    /**
     * @description set of all amp elements used in this file
     * @example
     * ['amp-img', 'amp-analytics']
     * @type {Set<string>}
     */
    this.ampElementSelectors = fileMetadata.ampElementSelectors;

    /**
     * @description set of all attribute css selectors declared in this file
     * @example
     * a[href$=".org"] {...}
     * @type {Set<string> | *}
     */
    this.attributeSelectors = fileMetadata.attributeSelectors;

    /**
     * @description set of all class css selectors declared in this file
     * @example
     * .class {...}
     * @example
     * .custom-button {...}
     * @type {Set<string> | *}
     */
    this.classSelectors = fileMetadata.classSelectors;

    /**
     * @description set of all elements css selectors declared in this file
     * @example
     * div {...}
     * @example
     * div ul li {...}
     * @type {Set<string> | *}
     */
    this.elementSelectors = fileMetadata.elementSelectors;

    /**
     * @description set of all empty css selectors used in this file.
     *    Should be removed once optimizations are complete
     *  @example
     *  .class1 .class2 {}
     * @type {Set<Object>}
     */
    this.emptySelectors = fileMetadata.emptySelectors;

    /**
     * @description set of all amp-* element tags that appear on page that
     *    would cause tier 0 optimization exceptions.
     * @type {Set<string>}
     */
    this.exceptionElementTags = fileMetadata.exceptionElementTags;

    /**
     * @description set of all id css selectors used in this file
     * @example
     * '#home-button' {...}
     * @type {Set<string>}
     */
    this.idSelectors = fileMetadata.idSelectors;

    /**
     * @description Concatenated string of all raw css extracted from <style>
     *   tags
     * @type {string}
     */
    this.rawCss = fileMetadata.joinedRawCss;

    /**
     * @description Parsed version of raw CSS for traversal and mutation.
     * @type {postcss.Root}
     */
    this.parsedCss = postcss.parse(this.rawCss);

    /**
     * @description a set of all css selectors that have specificity > 1
     * @example
     * .home .experience .experience-image .bg {...}
     * @type {Set<string>}
     */
    this.nestedSelectors = fileMetadata.nestedSelectors;

    /**
     * @description A Cheerio built DOM Object.
     * @type {$}
     */
    this.$ = fileMetadata.dom;
  }


  /**
   * Returns whether or not the AmpFile has a tag that would require Type 2
   *    optimizations. Checks AmpFile object variable to see if file has been
   *    run before.
   * @return {boolean} this._hasExceptionTag
   */
  hasExceptionTags() {
    return this.exceptionElementTags.size > 0;
  }

  /**
   * @description Translates he current AmpFile.$ to HTML and saves it to a new file;
   * @param {string} outputDir - directory path where the file is to be saved.
   * @param {?string} fileNameDecorator - String to be appended to input file name
   *    to differentiate the file
   */
  write(outputDir, fileNameDecorator) {

    /**
     * Because we extracted all the CSS into a single string, we only need 1
     *  <style> tag beyond the amp-boilerplate style tags. Therefore we can
     *    remove all other <style> tags (including existing amp-custom
     *    tags)....
     */
    this.$("style").not("[amp-boilerplate='']").remove();

    /** And append the final, optimized CSS to the DOM <head>. */
    this.$('head').append(`<style amp-custom>${this.parsedCss.toString()}</style>`);
    const html = this.$.html();

    const fileName = this.fileName.split('.')[0];
    const fileType = this.fileName.split('.')[1];
    this._outputFilePath =
        `../${outputDir}/${fileName}` +
        (fileNameDecorator ? `_${fileNameDecorator}` : '') + '.' + fileType;

    if(!fs.existsSync(`../${outputDir}`)) {
      fs.mkdirSync(`../${outputDir}`);
    }
    fs.writeFileSync(this._outputFilePath, html);
    this._stats.endTime = performance.now();
    this._stats.status = "complete";
  }

  /**
   * @description Generates and retrieves timing and optimization stats for a given file.
   * @return {{fileName: string,
   *    status: string,
   *    inputSize: number,
   *    outputSize: number,
   *    startTime: number,
   *    endTime: number,
   *    selectorsRemoved: number}}
   */
  stats() {
    this._stats.inputSize = fs.statSync(this.fileName).size;

    if(this._stats.status === 'complete') {
      this._stats.outputSize = fs.statSync(this._outputFilePath).size;
    }
    return this._stats;
  }

  /**
   * @description Increases "selectorsRemoved" stat by 1.
   * @return {number}
   */
  incrementSelectorsRemoved() {
    this._stats.selectorsRemoved += 1;
  }
}

module.exports = AmpFile;