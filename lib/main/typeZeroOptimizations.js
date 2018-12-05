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
const typeZeroOptimizations = {
  /**
   * Remove all element selectors that contain no style rules
   * @param {AmpFile} ampFile
   */
  removeEmptySelectors: function(ampFile){},

  /**
   * @description Remove all selectors with specific class names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   * @param {AmpFile} ampFile
   */
  removeUnusedClassSelectors: function(ampFile){
    return this.selectorIterator(ampFile, 'classSelectors', '.');
  },

  /**
   * @description Removes all amp-* element selectors that are not implemented via a corresponding
   *    `<amp-*>` element
   * @param {AmpFile} ampFile
   */
  removeUnusedAmpSelectors: function(ampFile){
    return this.selectorIterator(ampFile, 'ampElementSelectors')
  },

  /**
   * @description Removes all "element[selector=value] selectors that are not used
   * @param {AmpFile} ampFile
   */
  removeUnusedAttributeSelectors: function(ampFile){
    return this.selectorIterator(ampFile, 'attributeSelectors');
  },

  /**
   * @description Parses all DOM selectors and removes any that have no corresponding DOM
   *    element.
   * @example
   * If the DOM does not have a <blockquote>, we can remove selectors like:
   *    .class1 > .class2 > blockquote{}
   * @param {AmpFile} ampFile
   */
  removeUnusedElementSelectors: function(ampFile){
    return this.selectorIterator(ampFile, 'elementSelectors')
  },

  /**
   * @description Remove all selectors with specific id names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   * @param {AmpFile} ampFile
   */
  removeUnusedIdSelectors: function(ampFile){
    return this.selectorIterator(ampFile, 'idSelectors', '#')
  },

  /**
   * Iterator function used in each 'remove*()' function.
   * @param ampFile
   * @param selectorType
   * @param prefix - The CSS declaration prefix
   * @example
   * '.' for a ".class"
   * @example
   * '#" for an "#id"
   */
  selectorIterator: function(ampFile, selectorType, prefix = '') {
    debugger;
    ampFile[selectorType].forEach(selector => {
      let rules = ampFile.parsedCss;
      let prefixedSelector = prefix+selector;
      if (ampFile.$(prefixedSelector).toArray() === 0) {
        rules.walkRules(prefixedSelector, node => {
          console.log(prefixedSelector)
          console.log(node)
          if(node.selector === prefixedSelector) {
            node.remove();
            ampFile.incrementSelectorsRemoved()
          }
        })
      }
    })
  },


  /**
   * @description Executes all Type Zero optimizations
   * @param ampFile
   */
  optimize: function(ampFile) {
    this.removeEmptySelectors(ampFile);
    this.removeUnusedAmpSelectors(ampFile);

    if(!ampFile.hasExceptionTags()) {
      this.removeUnusedClassSelectors(ampFile);
      this.removeUnusedAttributeSelectors(ampFile);
      this.removeUnusedIdSelectors(ampFile);
      this.removeUnusedElementSelectors(ampFile);
    }
    return ampFile
  }

};

module.exports = typeZeroOptimizations;