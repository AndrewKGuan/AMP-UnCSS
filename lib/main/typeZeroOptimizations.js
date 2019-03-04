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
        ampFile.incrementSelectorsRemoved('emptySelectors', rule.selector);
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

  _removeUnusedPseudos: function(ampFile) {
    return this._pseudoSelectorIterator(ampFile, 'pseudos');
  },
  _removeUnusedEscapedPseudos: function(ampFile) {
    return this._escapedPseudoSelectorIterator(ampFile, 'escapedPseudos');
  },
  _removeUnusedGeneralSelectors: function(ampFile) {
    return this._selectorIterator(ampFile, 'general')
  },
  _handleCommaSeparatedSelectors: function(ampFile) {
    ampFile.commaSeparatedSelectors.forEach(css=> {

      // Delete empty rules
      ampFile.parsedCss.walkRules(css.selectorStr, rule => {
        if(rule.nodes.length === 0) {
          ampFile.incrementSelectorsRemoved('emptySelectors', css.selectorStr);
          rule.remove();
        }
      });

      // Check if any selectors in CSS is used
      css.selectorsList.forEach(selector => {
        if(ampFile.$(selector).toArray().length > 0) {
          css.isUsed = true
        }
      });

      // Delete unused rules
      if(!css.isUsed) {
        ampFile.parsedCss.walkRules(css.selectorStr, rule => {
          ampFile.incrementSelectorsRemoved('Comma Separated Selector', css.selectorStr);
          rule.remove()
        })
      }

    })
  },

  _removeUnusedKeyframes: function(ampFile){
    const keyframeNodes = ampFile.keyFrames;
    keyframeNodes.forEach(node => {
      const animName = node.ruleName;

      ampFile.parsedCss.walkRules(rule => {
        rule.nodes.forEach(ruleNode => {
          if(ruleNode.value.includes(animName)){
            node.isUsed = true;
          }
        })
      });

      const unusedKeyframes = [];
      keyframeNodes.forEach(node => {
        if(!node.isUsed) {
          unusedKeyframes.push(node.ruleName);
        }
      });

      ampFile.parsedCss.walkAtRules('keyframes', rule => {
        if(unusedKeyframes.includes(rule.params)) {
          ampFile.incrementSelectorsRemoved('keyframes', rule.params);
          rule.remove();
        }
      })
    });
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
      let prefixedSelector = prefix+selector;
      let rules = ampFile.parsedCss;

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

  _pseudoSelectorIterator: function(ampFile, selectorType) {
    let rules = ampFile.parsedCss;
    ampFile[selectorType].forEach(({base, modifier}) => {
      if(ampFile.$(base).toArray().length === 0) {
      //  selector doesn't exist in HTML. Iterate through CSS rules and remove every use
        rules.walkRules(base+modifier, node => {
          if(node.selector === base+modifier) {
            node.remove();
            ampFile.incrementSelectorsRemoved(selectorType, base+modifier);
          }
        })
      }
    })
  },
  _escapedPseudoSelectorIterator: function(ampFile, selectorType) {
    let rules = ampFile.parsedCss;
    ampFile[selectorType].forEach(selector => {
      /**
       * Split the selector into necessary parts.
       * @example
       *  .class\:hover\:font-hairline:hover becomes
       *  .class\:hover\:font-hairline and :hover
       */
      const selectorNoClassDot = selector.slice(1);
      const partList = selectorNoClassDot.split('\\:');
      const pseudoSuffix = partList[partList.length - 1].split(':').slice(1).join(':');
      partList[partList.length - 1] = partList[partList.length - 1].split(':')[0];
      const trueSelector = partList.join(':');
      let selectorIsUsed = false;
      ampFile.$("*").toArray().forEach(el => {
        if(
            (el.attribs.class && el.attribs.class === trueSelector) ||
            (el.attribs.id && el.attribs.id === trueSelector)
        ) {
          selectorIsUsed = true;
        }
      });

      if(!selectorIsUsed) {
        rules.walkRules(selector, node => {
          if (node.selector === selector) {
            node.remove();
            ampFile.incrementSelectorsRemoved(selectorType, selector);
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
      this._removeUnusedGeneralSelectors(ampFile);
      this._removeUnusedPseudos(ampFile);
      this._removeUnusedEscapedPseudos(ampFile); // Currently doesn't work...
      this._handleCommaSeparatedSelectors(ampFile);
      this._removeUnusedKeyframes(ampFile);
      // this._removeUnusedClassSelectors(ampFile);
      // this._removeUnusedAttributeSelectors(ampFile);
      // this._removeUnusedIdSelectors(ampFile);
      // this._removeUnusedElementSelectors(ampFile);
    }
    return ampFile

  }

};

module.exports = typeZeroOptimizations;