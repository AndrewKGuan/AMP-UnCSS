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
   * TODO: Make this more robust
   * @private
   */
  _removeEmptySelectors: function(ampFile){
    ampFile.parsedCss.walkRules(rule => {
      if (rule.nodes.length === 0) {
        rule.remove();
        ampFile.incrementSelectorsRemoved('emptySelectors', rule.selectors);
      }
    });
  },

  /**
   * @description Remove all selectors with specific class names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedClassSelectors: function(ampFile){
    return this._selectorIterator(ampFile, 'classSelectors', '.');
  },

  /**
   * @description Removes all amp-* element selectors that are not implemented via a corresponding
   *    `<amp-*>` element
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedAmpSelectors: function(ampFile){
    return this._selectorIterator(ampFile, 'ampElementSelectors')
  },

  /**
   * @description Removes all "element[selector=value] selectors that are not used
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedAttributeSelectors: function(ampFile){
    return this._selectorIterator(ampFile, 'attributeSelectors');
  },

  /**
   * @description Parses all DOM selectors and removes any that have no corresponding DOM
   *    element.
   * @example
   * If the DOM does not have a <blockquote>, we can remove selectors like:
   *    .class1 > .class2 > blockquote{}
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedElementSelectors: function(ampFile){
    return this._selectorIterator(ampFile, 'elementSelectors')
  },

  /**
   * @description Remove all selectors with specific id names that never occur on page.
   * @example
   * If the DOM does not have a <blockquote class="bigQuote">, we can remove
   * selectors like: .class1 > .bigQuote > blockquote{}
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedIdSelectors: function(ampFile){
    return this._selectorIterator(ampFile, 'idSelectors', '#')
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
   * @private
   */
  _selectorIterator: function(ampFile, selectorType, prefix = '') {
    ampFile[selectorType].forEach(selector => {
      let rules = ampFile.parsedCss;
      let prefixedSelector = prefix+selector;
      console.log(prefix, prefixedSelector, selectorType)
      if (ampFile.$(prefixedSelector).toArray().length === 0) {
        rules.walkRules(prefixedSelector, node => {
          if(node.selector === prefixedSelector) {
            node.remove();
            ampFile.incrementSelectorsRemoved(selectorType, prefixedSelector);
          }
        })
      }
    })
  },

  /**
   * @description Executes all Type Zero optimizations
   * @param {AmpFile} ampFile
   * @return {AmpFile}
   */
  optimize: function(ampFile) {
    this._removeEmptySelectors(ampFile);
    this._removeUnusedAmpSelectors(ampFile);

    if(!ampFile.hasExceptionTags()) {

      this._removeUnusedClassSelectors(ampFile);
      this._removeUnusedAttributeSelectors(ampFile);
      this._removeUnusedIdSelectors(ampFile);
      this._removeUnusedElementSelectors(ampFile);
    }
    return ampFile
  }

};

module.exports = typeZeroOptimizations;