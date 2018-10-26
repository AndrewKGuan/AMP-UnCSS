/**
 * @file DOM parsing interface to decouple core code from any library leveraged
 * @version 0.1
 * @requires jsom
 */


export default DomParser = {

  /**
   * Build a static DOM representation of HTML file
   * @param {string} fileName
   * @return {Object}
   */
  buildDom: function(fileName){},

  /**
   * Return a Set of class selectors used in inline styles and <style> tag
   *    declaration blocks
   * @param {Object} dom
   * @return {Set<Object>}
   */
  getClassSelectors: function(dom){},

  /**
   * Return a Set of element selectors used in inline styles and <style> tag
   *    declaration blocks
   * @param {Object} dom
   * @return {Set<Object>}
   */
  getElementSelectors: function(dom){},

  /**
   * Return a Set of attribute selectors used in inline styles and <style>
   *    tag declaration blocks
   * @param {Object} dom
   * @return {Set<Object>}
   */
  getAttributeSelectors: function(dom){},

  /**
   * Return a Set of classes and element tags used
   * @param {Object} dom
   * @return {{Object}<string, Set<Object>>}
   */
  getClassesAndElements: function(dom){},


}