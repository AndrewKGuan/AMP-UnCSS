/**
 * @file Optimizer that handles basic CSS optimizations including:
 * Removal of all AMP-* selectors that don't have corresponding AMP elements,
 * Removal of all selectors that contain a tag not present in the DOM,
 * Removal of all selectors with specific class names that don't occur on the page,
 * & removal of empty selectors,
 * @version 0.1
 */

/**
 * Controls all Type 0 Ops
 */
class TypeZeroOptimizer {
  /**
   * @constructor
   */
  constructor(){}

  /**
   * Remove all element selectors that contain no style rules
   */
  removeEmptySelectors(){}

  /**
   * Remove all class selectors that contain no style rules
   */
  removeEmptyClassSelectors(){}

  /**
   * Removes all amp-* element selectors that are not implemented via a corresponding
   *    `<amp-*>` element
   */
  removeUnusedAmpSelectors() {}

  /**
   * Parses all DOM selectors and removes any that have no corresponding DOM
   *    element.
   * @example
   * If the DOM does not have a <blockquote>, we can remove selectors like:
   *    .class1 > .class2 > blockquote{}
   */
  removeUnusedElementSelectors(){
    // 1. Test for exit conditions
    //    a) Presence of dynamic amp-element
    //    b) Presence of amp-images that spawn sub elements (<amp-image> > <img>)
    // 2. If (No exit conditions exist)
    //    a)  Run optimization
    //    Else
    //    b) Defer to Type 2 Opt if config allows
  }

  /**
   * Remove all selectors with specific class names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   */
  removeUnusedCssSelectors(){
    // 1. Test for exit conditions
    //    a) Presence of dynamic amp-element
    //    b) Presence of amp-images that spawn sub elements (<amp-image> > <img>)
    // 2. If (No exit conditions exist)
    //    a)  Run optimization
    //    Else
    //    b) Defer to Type 2 Opt if config allows
  }

  /**
   * Executes all TypeOneOps
   */
  optimize() {}

}

module.exports = TypeZeroOptimizer;