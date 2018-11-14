/**
 * @file File class to hold pertinent data about an optimization target file
 * @version 0.1
 */

// import DomParser from "../interfaces/DomParser"
const tags = require('../utils/tags');
const DomParser = require("../interfaces/DomParser");
/**
 *
 */
class AmpFile {

  /**
   * @param {Object} file - An object containing configuration setting
   */
  constructor(file){
    if(file != 'test' ) {
      this.file = file;
      this._prepFile();
    }
  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Object} Static DOM representation of file HTML.
   */
  _prepFile() {
    /**
     *
     * @type {* | {dom: ($), ampElementSelectors: Set<any>, attributeSelectors: Set<any>, classSelectors: Set<any>, elementSelectors: Set<any>, emptySelectors: Set<any>, idSelectors: Set<any>, nestedSelectors: Set<any>}}
     * @private
     */
    let fileMetadata = DomParser.extractDomData(this.file);

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
     * @description set of all amp elements used in this file
     * @example
     * ['amp-img', 'amp-analytics']
     * @type {Set<string>}
     */
    this.ampElementSelectors = fileMetadata.ampElementSelectors;

    /**
     * @description set of all empty css selectors used in this file.
     *    Should be removed once optimizations are complete
     *  @example
     *  .class1 .class2 {}
     * @type {Set<Object>}
     */
    this.emptySelectors = fileMetadata.emptySelectors;

    /**
     * @description set of all id css selectors used in this file
     * @example
     * '#home-button' {...}
     * @type {Set<string>}
     */
    this.idSelectors = fileMetadata.idSelectors;

    /**
     * @description a set of all css selectors that have specificity > 1
     * @example
     * .home .experience .experience-image .bg {...}
     * @type {Set<string>}
     */
    this.nestedSelectors = fileMetadata.nestedSelectors

    var {classes , elements} = fileMetadata.getClassesAndElements(this._dom);

    /** @description list of all classes used in this file */
    this.classes = classes;

    /** @description list of all elements used in this file */
    this.elements = elements;

    this.consolidateStyleTags()
  }

  /** Manipulates DOM to consolidate all <style> tags into a single tag */
  consolidateStyleTags() {}

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

}

module.exports = AmpFile;