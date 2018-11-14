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
    this._dom = DomParser.extractDom(this.file);

    /** @description list of all attribute selectors declared in this file */
    this.attributeSelectors = DomParser.getAttributeSelectors(this._dom);

    /** @description list of all class selectors declared in this file */
    this.classSelectors = DomParser._getClassSelectors(this._dom);

    /** @description list of all elements selectors declared in this file */
    this.elementSelectors = DomParser.getElementSelectors(this._dom);

    var {classes , elements} = DomParser.getClassesAndElements(this._dom);

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