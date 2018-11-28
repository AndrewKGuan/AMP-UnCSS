/**
 * @file File class to hold pertinent data about an optimization target file
 * @version 0.1
 */

const tags = require('../utils/tags');
const DomParser = require("../interfaces/DomParser");
const fs = require('fs');
const {performance} = require('perf_hooks');

/**
 *
 */
class AmpFile {

  /**
   * @param {string} fileName
   */
  constructor(fileName){
    this.fileName = fileName;
    if(fileName !== 'test' ) {
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
      fileName,
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
     *
     * @type {* | {
     *    dom: ($),
     *    ampElementSelectors: Set<string>,
     *    attributeSelectors: Set<string>,
     *    classSelectors: Set<string>,
     *    elementSelectors: Set<jQuery>,
     *    emptySelectors: Set<string>,
     *    idSelectors: Set<string>,
     *    nestedSelectors: Set<string>}}
     * @private
     */
    let fileMetadata = DomParser.extractDomData(this.fileName);

    /**
     * @description set of all amp elements used in this file
     * @example
     * ['amp-img', 'amp-analytics']
     * @type {Set<string>}
     */
    this._ampElementSelectors = fileMetadata.ampElementSelectors;

    /**
     * @description set of all attribute css selectors declared in this file
     * @example
     * a[href$=".org"] {...}
     * @type {Set<string> | *}
     */
    this._attributeSelectors = fileMetadata.attributeSelectors;

    /**
     * @description set of all class css selectors declared in this file
     * @example
     * .class {...}
     * @example
     * .custom-button {...}
     * @type {Set<string> | *}
     */
    this._classSelectors = fileMetadata.classSelectors;

    /**
     * @description set of all elements css selectors declared in this file
     * @example
     * div {...}
     * @example
     * div ul li {...}
     * @type {Set<string> | *}
     */
    this._elementSelectors = fileMetadata.elementSelectors;

    /**
     * @description set of all empty css selectors used in this file.
     *    Should be removed once optimizations are complete
     *  @example
     *  .class1 .class2 {}
     * @type {Set<Object>}
     */
    this._emptySelectors = fileMetadata.emptySelectors;

    /**
     * @description set of all id css selectors used in this file
     * @example
     * '#home-button' {...}
     * @type {Set<string>}
     */
    this._idSelectors = fileMetadata.idSelectors;

    /**
     * @description a set of all css selectors that have specificity > 1
     * @example
     * .home .experience .experience-image .bg {...}
     * @type {Set<string>}
     */
    this._nestedSelectors = fileMetadata.nestedSelectors;

    /**
     * @description A Cheerio built DOM Object.
     * @type {$}
     * @private
     */
    this._dom = fileMetadata.dom;
  }


  /**
   * Returns whether or not the AmpFile has a tag that would require Type 2
   *    optimizations. Checks AmpFile object variable to see if file has been
   *    run before.
   * @return {boolean} this._hasExceptionTag
   */
  hasExceptionTags() {
    if(this._hasExceptionTags == null) {
      this._hasExceptionTags = tags.exceptionTags.reduce((acc, tag) => {
        if(!acc) {
          acc = !!this.elements.has(tag);
        }
        return acc;
      }, false)
    }
    return this._hasExceptionTags;
  }

  /**
   * @description Translates he current AmpFile._dom to HTML and saves it to a new file;
   * @param {string} outputDir - directory path where the file is to be saved.
   * @param {?string} fileNameDecorator - String to be appended to input file name
   *    to differentiate the file
   */
   write(outputDir, fileNameDecorator) {
    const html = this._dom.html();
    this._outputFilePath =
        `../${outputDir}/${this.fileName}` +
        (fileNameDecorator ? `_${fileNameDecorator}` : '');


    const stats = this._stats;
    fs.writeFileSync(this._outputFilePath, html);
    this._stats.endTime = performance.now();
    this._stats.status = "complete";
  }

  /**
   *
   * @return {{fileName: string, status: string, inputSize: number, outputSize: number, startTime: number, endTime: number, selectorsRemoved: number}}
   */
  getStats() {
    this._stats.inputSize = fs.statSync(this.fileName).size;

    if(this._stats.status === 'complete') {
      this._stats.outputSize = fs.statSync(this._outputFilePath).size;
    }
    return this._stats;
  }

}

module.exports = AmpFile;