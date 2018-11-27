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
export default typeOneOptimizations = {
  /**
   * Remove all element selectors that contain no style rules
   * @param {AmpFile} ampFile
   */
  removeEmptySelectors: function(ampFile){},

  /**
   * Remove all class selectors that contain no style rules
   * @param {AmpFile} ampFile
   */
  removeEmptyClassSelectors: function(ampFile){},

  /**
   * Removes all amp-* element selectors that are not implemented via a corresponding
   *    `<amp-*>` element
   * @param {AmpFile} ampFile
   */
  removeUnusedAmpSelectors: function(ampFile){},

  /**
   * Parses all DOM selectors and removes any that have no corresponding DOM
   *    element.
   * @example
   * If the DOM does not have a <blockquote>, we can remove selectors like:
   *    .class1 > .class2 > blockquote{}
   * @param {AmpFile} ampFile
   */
  removeUnusedElementSelectors: function(ampFile){
    // 1. Test for exit conditions
    //    a) Presence of dynamic amp-element
    //    b) Presence of amp-images that spawn sub elements (<amp-image> > <img>)
    // 2. If (No exit conditions exist)
    //    a)  Run optimization
  },

  /**
   * Remove all selectors with specific class names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   * @param {AmpFile} ampFile
   */
  removeUnusedCssSelectors: function(ampFile){
    // 1. Test for exit conditions
    //    a) Presence of dynamic amp-element
    //    b) Presence of amp-images that spawn sub elements (<amp-image> > <img>)
    // 2. If (No exit conditions exist)
    //    a)  Run optimization
  },

  /**
   * Executes all Type Zero optimizations
   */
  optimize: function(ampFile) {
    this.removeEmptySelectors(ampFile);
    this.removeEmptyClassSelectors(ampFile);
    this.removeUnusedAmpSelectors(ampFile);

    if(!ampFile.hasExceptionTag()) {
      this.removeUnusedCssSelectors();
      this.removeUnusedElementSelectors();
    }
  }

}
