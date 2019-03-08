/**
 * @file File class to hold pertinent data about an optimization target file
 * @version 0.1
 */

const tags = require('../utils/tags');
const DomParser = require("../interfaces/DomParser");
const fs = require('fs');
const {performance} = require('perf_hooks');
const postcss = require('postcss');

/**
 *  Class representing an AMP HTML file.
 */
class AmpFile {

  /**
   * @param {Vinyl | string} file
   * @param {string} [type = name] - input type of file
   */
  constructor(file, type = 'name'){
    this.type = type;

    if(this.type === 'streamable') {
      // Since file type is Vinyl (via Gulp API), we can use Vinyl methods for URL parsing.
      this.filePath = file.path;
      this.fileName = file.basename;
      this.fileDir = file.base;
      this.fileExt = file.extname;
      this.rawHtml = String(file.contents);
    }
    else {
      const fileParts = file.split('/');
      this.filePath = file;
      this.fileName = fileParts.pop();
      this.fileExt = this.fileName.split('.')[1];
      this.fileDir = fileParts.join('/');
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
      selectorsRemoved: {}
    };
    if (file !== 'test')  this._prepFile();

  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Object} Static DOM representation of file HTML.
   */
  _prepFile() {
      let fileMetadata = DomParser.extractDomData(this);
      this._extractFileData(fileMetadata);

      /**
       * @description Parsed version of raw CSS for traversal and mutation.
       * @type {postcss.Root}
       */
      this.parsedCss = postcss.parse(this.rawCss);
      // this.stubAmpImg();
  }

  /**
   * @param data
   * @private
   */
  _extractFileData(data) {

    /**
     * @description A Cheerio built DOM Object.
     * @type {$}
     */
    this.$ = data.dom;

    /** @description Concatenated string of all raw css extracted from <style> tags */
    this.rawCss = data.joinedRawCss;
    this.escapedPseudos = data.escapedPseudos;
    this.pseudos = data.pseudos;
    this.general = data.general;
    this.commaSeparatedSelectors = data.commaSeparatedSelectors;
    this.ampElementSelectors = data.ampElementSelectors;
    this.keyFrames = data.keyFrames

    /**
     * @description set of all amp-* element tags that appear on page that
     *    would cause tier 0 optimization exceptions.
     * @type {Set<string>}
     */
    this.exceptionElementTags = data.exceptionElementTags;


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
   * Return Optimized HTML in String format
   *  Note: only used with
   * @return {string|*|void}
   */
  returnOptimizedHtml() {
    return this.optimizedHtml;
  }

  /**
   * Writes HTML to file and given path.
   * @param {string} targetDirectory - directory path where the file is to be saved.
   * @param {?string} filenameDecorator - String to be appended to input file name
   *    to differentiate the file
   */
  writeData(targetDirectory, filenameDecorator) {
    const fileName = this.fileName.split('.')[0];
    const fileType = this.fileName.split('.')[1];
    const decorator = filenameDecorator || '';
    this._outputFilePath = `./${targetDirectory}/${fileName + decorator}.${fileType}`;

    if(!fs.existsSync(`./${targetDirectory}`)) {
      fs.mkdirSync(`./${targetDirectory}`);
    }
    fs.writeFileSync(this._outputFilePath, this.optimizedHtml);
  }

  /**
   * @description Translates the current AmpFile.$ to HTML and saves it to instance variable
   */
  prepData() {
    /**
     * Because we extracted all the CSS into a single string, we only need 1
     *  <style> tag beyond the amp-boilerplate style tags. Therefore we can
     *  remove all other <style> tags (including existing amp-custom
     *  tags)....
     */
    this.$("style").not("[amp-boilerplate='']").remove();

    /** And append the final, optimized CSS to the DOM <head>. */
    this.$('head').append(`<style amp-custom>${this.parsedCss.toString()}</style>`);

    this.optimizedHtml =
        this.$.html()
            .replace(/="{2}/g, "")
            .replace(/\r\n/g, '\n')
            .replace(/\n/g,"");
    this._stats.endTime = performance.now();
    this._stats.status = "complete";
    return this
  }

  /**
   * @description Generates and retrieves timing and optimization _stats for a given filePath.
   * @return {{fileName: string,
   *    status: string,
   *    inputSize: number,
   *    outputSize: number,
   *    startTime: number,
   *    endTime: number,
   *    selectorsRemoved: number}}
   */
  stats() {
    this._stats.inputSize = this.type === 'streamable' ?
        this.rawHtml.length:
        fs.statSync(this.filePath).size;

    if(this._stats.status === 'complete') {
      this._stats.outputSize = this.optimizedHtml.length;
      this._stats.hasExceptionTags = this.hasExceptionTags();
    }

    return this._stats;
  }

  /**
   * @description Increases "selectorsRemoved" stat by 1.
   * @param {string} selectorType - Type of selector removed.
   * @param {string} prefixedSelector - Specific selector removed, prefixed with # or . if id or class selector, respectively .
   * @return {number}
   */
  incrementSelectorsRemoved(selectorType, prefixedSelector) {
    if(!this._stats.selectorsRemoved[selectorType]) {
      this._stats.selectorsRemoved[selectorType] = {
        selectors: [prefixedSelector],
        count: 1,
      };
    } else {
      this._stats.selectorsRemoved[selectorType].selectors.push(prefixedSelector);
      this._stats.selectorsRemoved[selectorType].count += 1;
    }
  }

  stubAmpImg() {
    this.$('amp-img').append('<img src="" >')
  }
}

module.exports = AmpFile;