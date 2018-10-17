/**
 * @file Optimizer that handles CSS optimizations requiring a DOM parser, including:
 * - Removal of all class- and attribute-less selectors that have no corresponding DOM elements
 * - Removal of all selectors (including classes and attributes) that don't have a corresponding DOM element.
 * Only instantiated and used if UnCss config is 1 or higher
 * @version 0.1
 */

/**
 *
 */
class TierOneOps {

  /**
   * @param {Object} config - An object containing configuration setting
   */
  constructor({}){

  }



}

module.exports = TierOneOps;