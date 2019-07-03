/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file Optimizer that handles basic CSS optimizations including:
 * Removal of all AMP-* selectors that don't have corresponding AMP elements,
 * Removal of all selectors that contain a tag not present in the DOM,
 * Removal of all selectors w/specific class names that don't occur on the page,
 * & removal of empty selectors,
 * @version 0.1
 */

const {performance} = require('perf_hooks');
const DomParser = require('../main/dom-parser.js');

/**
 * Controls all Type 0 Ops
 */
const typeZeroOptimizations = {
  /**
   * Remove all element selectors that contain no style rules
   * @param {AmpFile} ampFile
   * @private
   */
  _removeEmptySelectors: function(ampFile) {
    ampFile.parsedCss.walkRules((rule) => {
      if (rule.nodes.length === 0) {
        rule.remove();
        // ampFile.incrementSelectorsRemoved('emptySelectors', rule.selector);
      }
    });
  },

  /**
   * @description Removes all amp-* element selectors that are not implemented
   * via a corresponding <amp-*> element
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedAmpSelectors: function(ampFile) {
    this._selectorIterator(ampFile, 'ampElementSelectors');
  },

  /**
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedPseudos: function(ampFile) {
    this._pseudoSelectorIterator(ampFile, 'pseudos');
  },

  /**
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedEscapedPseudos: function(ampFile) {
    this._escapedPseudoSelectorIterator(ampFile, 'escapedPseudos');
  },

  /**
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedGeneralSelectors: function(ampFile) {
    this._selectorIterator(ampFile, 'general');
  },

  /**
   * @param {AmpFile} ampFile
   * @private
   */
  _handleCommaSeparatedSelectors: function(ampFile) {
    ampFile.commaSeparatedSelectors.forEach((css) => {
      // Delete empty rules
      ampFile.parsedCss.walkRules(css.selectorStr, (rule) => {
        if (rule.nodes.length === 0) {
          ampFile.incrementSelectorsRemoved('emptySelectors', css.selectorStr);
          rule.remove();
        }
      });

      // Check if any selectors in CSS is used
      css.selectorsList.forEach((selector) => {
        if (!css.isUsed) {
          // Can skip checking whole list if at least one is used.
          if (DomParser._containsPseudo(selector) ||
              DomParser._containsEscapedPseudo(selector)) {
            // If the selector has a pseudo, check just the selector w/out
            //    the attached pseudo.
            const base = selector.split(':').shift();
            const baseCount = ampFile.staticDomCount(base);
            if (baseCount > 0) css.isUsed = true;
          } else if ( ampFile.staticDomCount(selector) > 0) css.isUsed = true;
        }
      });

      // Delete unused rules
      if (!css.isUsed) {
        ampFile.parsedCss.walkRules(css.selectorStr, (rule) => {
          ampFile.incrementSelectorsRemoved(
              'Comma Separated Selector', css.selectorStr);
          rule.remove();
        });
      }
    });
  },

  /**
   * @param {AmpFile} ampFile
   * @private
   */
  _removeUnusedKeyframes: function(ampFile) {
    const keyframeNodes = ampFile.keyFrames;
    keyframeNodes.forEach((node) => {
      const animationName = node.ruleName;

      ampFile.parsedCss.walkRules((rule) => {
        rule.nodes.forEach((ruleNode) => {
          // If ruleNode.value is undefined, the node is most likely a Comment
          //    node and can be ignored.
          if (!(ruleNode.value && ruleNode.value.includes(animationName))) {
            node.isUsed = true;
          }
        });
      });

      keyframeNodes.forEach((node) => {
        if (!node.isUsed) {
          this._addToGarbage(ampFile, node.ruleName, 'keyframes');
        }
      });
    });
  },

  /**
   * Iterator function used in each 'remove*()' function.
   * @param {AmpFile} ampFile
   * @param {string} selectorType
   * @param {?string} prefix - The CSS declaration prefix
   * @example
   * '.' for a ".class"
   * @example
   * '#" for an "#id"
   * @private
   */
  _selectorIterator: function(ampFile, selectorType, prefix = '') {
    ampFile[selectorType].forEach((selector) => {
      const prefixedSelector = prefix+selector;

      if (ampFile.staticDomCount(prefixedSelector) === 0) {
        this._addToGarbage(ampFile, prefixedSelector, selectorType);
      }
    });
  },

  /**
   *
   * @param {AmpFile} ampFile
   * @param {string} selectorType
   * @private
   */
  _pseudoSelectorIterator: function(ampFile, selectorType) {
    ampFile[selectorType].forEach(({base, modifier}) => {
      if (ampFile.staticDomCount(base) === 0) {
        //  Selector doesn't exist in HTML. Iterate through CSS rules and remove
        //  every use
        this._addToGarbage(ampFile, base+modifier, selectorType);
      }
    });
  },

  /**
   * @param {AmpFile} ampFile
   * @param {string} selectorType
   * @private
   */
  _escapedPseudoSelectorIterator: function(ampFile, selectorType) {
    ampFile[selectorType].forEach((selector) => {
      /**
       * Split the selector into necessary parts.
       * @example
       *  .class\:hover\:font-hairline:hover becomes
       *  .class\:hover\:font-hairline and :hover
       */
      const selectorNoClassDot = selector.slice(1);
      const partList = selectorNoClassDot.split('\\:');
      partList[partList.length - 1] =
          partList[partList.length - 1].split(':')[0];
      const trueSelector = partList.join(':');
      let selectorIsUsed = false;
      ampFile.staticDom.queryAll('*').forEach((el) => {
        if (
          (el.attribs.class && el.attribs.class === trueSelector) ||
          (el.attribs.id && el.attribs.id === trueSelector)
        ) selectorIsUsed = true;
      });

      if (!selectorIsUsed) {
        this._addToGarbage(ampFile, selector, selectorType);
      }
    });
  },

  _emptyGarbage(af) {
    const garbage = af.garbage;
    af.parsedCss.walkRules((rule) => {
      const selectorType = garbage[rule.selector];
      if (rule.nodes.length === 0) {
        rule.remove();
        af.incrementSelectorsRemoved('emptySelectors', rule.selector);
      } else if (selectorType) {
        rule.remove();
        af.incrementSelectorsRemoved(selectorType, rule.selector);
      }
    });
  },

  _addToGarbage(af, selector, selectorType) {
    if (!af.garbage.selector) {
      af.garbage[selector] = selectorType;
    }
  },

  /**
   * @description Executes all Type Zero optimizations
   * @param {AmpFile} ampFile
   * @return {AmpFile}
   */
  optimize: function(ampFile) {
    if (ampFile.hasFailed()) return ampFile; // Don't bother optimizing anything

    // this._removeEmptySelectors(ampFile);
    this._removeUnusedAmpSelectors(ampFile);

    if (!ampFile.hasExceptionTags()) {
      // Needs to happen first because it offloads work to other selectors if
      // needed.
      this._handleCommaSeparatedSelectors(ampFile);
      this._removeUnusedGeneralSelectors(ampFile);
      this._removeUnusedPseudos(ampFile);
      this._removeUnusedEscapedPseudos(ampFile);
      this._removeUnusedKeyframes(ampFile);
    }
    this._emptyGarbage(ampFile);
    ampFile.setStatus('optimized', performance.now());
    ampFile.setStatus('optLevel', 0);
    return ampFile;
  },
};

module.exports = typeZeroOptimizations;
