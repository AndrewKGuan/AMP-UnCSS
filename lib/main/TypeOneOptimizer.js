/**
 * @file Optimizer that handles CSS optimizations requiring a full DOM parser
 *  such as Puppeteer.
 * Only instantiated and used if UnCss config is 1 or higher
 * @version 0.1
 */

class TypeOneOptimizer {

  /**
   * @param
   */
  constructor(){
  }


  /**
   * Parses all DOM selectors and removes any that have no corresponding DOM
   *    element.
   * @example
   * If the DOM does not have a <blockquote>, we can remove selectors like:
   *    .class1 > .class2 > blockquote{}
   */
  removeUnusedElementSelectors(){}

  /**
   * Remove all selectors with specific class names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   */
  removeUnusedCssSelectors(){}

  /** Executes type 1 optimizations */
  optimize(){}

}

module.exports = TypeOneOptimizer;