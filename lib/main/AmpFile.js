/**
 * @file File class to hold pertinent data about an optimization target file
 * @version 0.1
 */

import DomParser from "../interfaces/HTMLParser"

/**
 *
 */
class AmpFile {

  /**
   * @param {Object} config - An object containing configuration setting
   */
  constructor(file){
    this.file = file;

    this.buildStaticDom()
  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Object} Static DOM representation of file HTML.
   */
  buildStaticDom() {
    const dom = DomParser.buildDom(this.file);
    this._dom = dom;
  }


}