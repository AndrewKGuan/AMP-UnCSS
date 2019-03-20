/**
 * @file Optimizer that handles CSS optimizations requiring a full DOM parser
 *  such as Puppeteer.
 * Only instantiated and used if UnCss config is 1 or higher
 * @version 0.1
 */
const {performance} = require('perf_hooks');
const DomParser = require('../main/dom-parser');

const typeOneOptimizations = {
  /**
   * Iterates through all comma separated selectors and handles the selector
   *    based off the usages of its sub-selectors. If any of the sub-selectors
   *    are used, the entire rule is considered valid.
   * @param {AmpFile} ampFile
   * @return {Promise<void>}
   * @private
   */
  _handleCommaSeparatedSelectors: async function(ampFile) {
    return Promise.all(
        Array.from(ampFile.commaSeparatedSelectors).map(async (css) => {
          // Delete Empty rules
          ampFile.parsedCss.walkRules(css.selectorStr, (rule) => {
            if (rule.nodes.length === 0) {
              ampFile.incrementSelectorsRemoved(
                  'emptySelectors', css.selectorStr);
              rule.remove();
            }
          });

          // Iterate through remaining selectors
          await Promise.all(css.selectorsList.map(async (selector) => {
            const selectorCount = await ampFile.dynamicDomCount(selector);

            if (DomParser._containsPseudo(selector) ||
                DomParser._containsEscapedPseudo(selector)) {
              // If the selector has a pseudo, check just the selector w/out
              //    the attached pseudo.
              const base = selector.split(':').shift();
              const baseCount = await ampFile.dynamicDomCount(base);
              if (baseCount) css.isUsed = true;
            } else if (selectorCount > 0) css.isUsed = true;

            return selector;
          }));

          // Delete unused rules
          if (!css.isUsed) {
            ampFile.parsedCss.walkRules(css.selectorStr, (rule) => {
              ampFile.incrementSelectorsRemoved(
                  'Comma Separated Selector', css.selectorStr);
              rule.remove();
            });
          }
        })
    );
  },

  /**
   * @param {AmpFile} ampFile
   * @return {Promise<void>}
   * @private
   */
  _removeUnusedAmpSelectors: function(ampFile) {
    return this._selectorIterator(ampFile, 'ampElementSelectors');
  },

  /**
   * @param {AmpFile} ampFile
   * @return {Promise<void>}
   * @private
   */
  _removeUnusedGeneralSelectors: async function(ampFile) {
    await this._selectorIterator(ampFile, 'general')
        .catch((err) => {
          throw err;
        });
  },

  /**
   * @param {AmpFile} ampFile
   * @return {Promise<void>}
   * @private
   */
  _removeUnusedPseudos: async function(ampFile) {
    await this._pseudoSelectorIterator(ampFile, 'pseudos')
        .catch((err) => {
          throw err;
        });
  },
  /**
   * @param {AmpFile} ampFile
   * @return {Promise<void>}
   * @private
   */
  _removeUnusedEscapedPseudos: async function(ampFile) {
    await this._escapedPseudoSelectorIterator(ampFile, 'escapedPseudos')
        .catch((err) => {
          throw err;
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
          if (ruleNode.value.includes(animationName)) node.isUsed = true;
        });
      });

      const unusedKeyframes = [];
      keyframeNodes.forEach((node) => {
        if (!node.isUsed) {
          unusedKeyframes.push(node.ruleName);
        }
      });

      ampFile.parsedCss.walkAtRules('keyframes', (rule) => {
        if (unusedKeyframes.includes(rule.params)) {
          ampFile.incrementSelectorsRemoved('keyframes', rule.params);
          rule.remove();
        }
      });
    });
  },

  /**
   * @param {AmpFile} ampFile
   * @param {string} selectorType
   * @param {string} prefix - The selector prefix (i.e. '.' for a class or '#'
   *    for an id.
   * @return {Promise<void>}
   * @private
   */
  _selectorIterator: async function(ampFile, selectorType, prefix='') {
    const rules = ampFile.parsedCss;
    await ampFile[selectorType].forEach(async (selector) => {
      const prefixedSelector = prefix + selector;
      const prefixedSelectorCount = await ampFile
          .dynamicDomCount(prefixedSelector).catch((err) => {
            throw err;
          });

      if ( prefixedSelectorCount === 0) {
        rules.walkRules(prefixedSelector, (node) => {
          if (node.selector === prefixedSelector) {
            node.remove();
            ampFile.incrementSelectorsRemoved(selectorType, prefixedSelector);
          }
        });
      }
    });
  },

  /**
   * @param {AmpFile} ampFile
   * @param {string} selectorType
   * @return {Promise<void>}
   * @private
   */
  _pseudoSelectorIterator: async function(ampFile, selectorType) {
    const rules = ampFile.parsedCss;
    await ampFile[selectorType].forEach(async ({base, modifier}) => {
      const baseCount = await ampFile.dynamicDomCount(base).catch((err) => {
        throw err;
      });

      if (baseCount === 0) {
        //  Selector doesn't exist in HTML. Iterate through CSS rules and
        //  remove every use.
        rules.walkRules(base+modifier, (node) => {
          if (node.selector === base+modifier) {
            node.remove();
            ampFile.incrementSelectorsRemoved(selectorType, base+modifier);
          }
        });
      }
    });
  },

  /**
   * @param {AmpFile} ampFile
   * @param {string} selectorType
   * @return {Promise<void>}
   * @private
   */
  _escapedPseudoSelectorIterator: async function(ampFile, selectorType) {
    const rules = ampFile.parsedCss;
    const elsData = await ampFile.dynamicQueryAll('*')
        .catch((err) => {
          console.log(err);
          throw err;
        });

    ampFile[selectorType].forEach((selector) => {
      // Split the selector into necessary parts.
      // @example
      //  .class\:hover\:font-hairline:hover becomes
      //  .class\:hover\:font-hairline and :hover
      const selectorNoClassDot = selector.slice(1);
      const partList = selectorNoClassDot.split('\\:');
      partList[partList.length - 1] =
          partList[partList.length - 1].split(':')[0];
      const trueSelector = partList.join(':');
      let selectorIsUsed = false;


      elsData.els.forEach((el) => {
        if (
          (el.className && el.className === trueSelector) ||
          (el.id && el.id === trueSelector)
        ) {
          selectorIsUsed = true;
        }
      });

      if (!selectorIsUsed) {
        rules.walkRules(selector, (node) => {
          if (node.selector === selector) {
            node.remove();
            ampFile.incrementSelectorsRemoved(selectorType, selector);
          }
        });
      }
    });
  },

  /**
   * @param {AmpFile} ampFile
   * @private
   */
  _removeEmptySelectors: function(ampFile) {
    ampFile.parsedCss.walkRules((rule) => {
      if (rule.nodes.length === 0) {
        rule.remove();
        ampFile.incrementSelectorsRemoved('emptySelectors', rule.selector);
      }
    });
  },

  /**
   *  Executes type 1 optimizations
   *  @param {AmpFile} ampFile
   */
  optimize: async function(ampFile) {
    this._removeEmptySelectors(ampFile);
    await this._removeUnusedAmpSelectors(ampFile).catch((err) => {
      throw err;
    });
    await this._handleCommaSeparatedSelectors(ampFile).catch((err) => {
      throw err;
    });
    await this._removeUnusedGeneralSelectors(ampFile).catch((err) => {
      throw err;
    });
    await this._removeUnusedPseudos(ampFile).catch((err) => {
      throw err;
    });
    await this._removeUnusedEscapedPseudos(ampFile).catch((err) => {
      throw err;
    });
    this._removeUnusedKeyframes(ampFile);
    ampFile.setStatus('optimized', performance.now());
    ampFile.setStatus('optLevel', 1);
    return ampFile;
  },
};

module.exports = typeOneOptimizations;

