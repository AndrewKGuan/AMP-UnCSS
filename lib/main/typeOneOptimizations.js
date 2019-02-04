/**
 * @file Optimizer that handles CSS optimizations requiring a full DOM parser
 *  such as Puppeteer.
 * Only instantiated and used if UnCss config is 1 or higher
 * @version 0.1
 */

const typeOneOptimizations = {

  /**
   * Parses all DOM selectors and removes any that have no corresponding DOM
   *    element.
   * @example
   * If the DOM does not have a <blockquote>, we can remove selectors like:
   *    .class1 > .class2 > blockquote{}
   * @private
   */
  _removeUnusedElementSelectors: function(){},

  /**
   * Remove all selectors with specific class names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   * @private
   */
  _removeUnusedCssSelectors: function(){},

  /**
   *  Executes type 1 optimizations
   *  @param {AmpFile} ampFile
   */
  optimize: function(ampFile){

    /**
     * If !hasExceptionTag, these optimizations would have been handled in
     *    Type 1 Optimizations step
     */
    if(ampFile.hasExceptionTags()) {
      this._removeUnusedCssSelectors(ampFile);
      this._removeUnusedElementSelectors(ampFile);
    }
  }
};

module.exports = typeOneOptimizations;
