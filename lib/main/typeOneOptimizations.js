/**
 * @file Optimizer that handles CSS optimizations requiring a full DOM parser
 *  such as Puppeteer.
 * Only instantiated and used if UnCss config is 1 or higher
 * @version 0.1
 */

const {performance} = require('perf_hooks');
const DomParser = require('../interfaces/DomParser');


const typeOneOptimizations = {

  _handleCommaSeparatedSelectors: async function(ampFile) {
    return Promise.all(
        Array.from(ampFile.commaSeparatedSelectors).map(async css => {

          // Delete Empty rules
          ampFile.parsedCss.walkRules(css.selectorStr, rule => {
            if(rule.nodes.length === 0) {
              ampFile.incrementSelectorsRemoved('emptySelectors', css.selectorStr);
              rule.remove()
            }
          });

          let deferredSelectors = [];

          await Promise.all(css.selectorsList.map(async selector => {
            let selectorCount  = await ampFile.dynamicDom.count(selector);

            if(DomParser._hasPseudo(selector) ||  DomParser._hasEscapedPseudo(selector)) {
              // If the selector has a pseudo, double check just the pre-pseudo selector
              let base = selector.split(':').shift();
              let baseCount = await ampFile.dynamicDom.count(base);
              if (baseCount) css.isUsed = true;
            }
            else if(selectorCount > 0)
              css.isUsed = true;

            return selector;
          }));

          // Delete unused rules
          if(!css.isUsed) {
            ampFile.parsedCss.walkRules(css.selectorStr, rule => {
              ampFile.incrementSelectorsRemoved('Comma Separated Selector', css.selectorStr);
              rule.remove()
            })
          }
        })
    )
  },

  _removeUnusedAmpSelectors: function(ampFile) {
    return this._selectorIterator(ampFile, 'ampElementSelectors')
  },
  _removeUnusedGeneralSelectors: async function(ampFile) {
    await this._selectorIterator(ampFile, 'general')
        .catch(err => {
          throw err;
        })
  },
  _removeUnusedPseudos: async function(ampFile) {
    await this._pseudoSelectorIterator(ampFile, 'pseudos')
        .catch(err => {
          throw err;
        })
  },
  _removeUnusedEscapedPseudos: async function(ampFile) {
    await this._escapedPseudoSelectorIterator(ampFile, 'escapedPseudos')
        .catch(err => {
          throw err;
        })
  },
  _removeUnusedKeyframes: function(ampFile) {
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

  _selectorIterator: async function(ampFile, selectorType, prefix='') {
    let rules = ampFile.parsedCss;
    await ampFile[selectorType].forEach(async selector => {
      let prefixedSelector = prefix + selector,
          prefixedSelectorCount = await ampFile.dynamicDom.count(prefixedSelector).catch(e => {throw e});;

      if( prefixedSelectorCount === 0) {
        rules.walkRules(prefixedSelector, node => {
          if(node.selector === prefixedSelector) {
            node.remove();
            ampFile.incrementSelectorsRemoved(selectorType, prefixedSelector);
          }
        })
      }
    })
  },

  _pseudoSelectorIterator: async function(ampFile, selectorType) {
    let rules = ampFile.parsedCss;
    await ampFile[selectorType].forEach(async ({base, modifier}) => {
      let baseCount = await ampFile.dynamicDom.count(base).catch(e => {throw e});;
      if(baseCount === 0) {
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

  _escapedPseudoSelectorIterator: async function(ampFile, selectorType) {
    let rules = ampFile.parsedCss;
    const elList = await ampFile.dynamicDom.queryAll("*")
        .catch(err => {
          console.log(err)
          throw err
        });
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

      elList.forEach(el => {
        if(
            (el.className && el.className === trueSelector) ||
            (el.id && el.id === trueSelector)
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

  _removeEmptySelectors: function(ampFile) {
    ampFile.parsedCss.walkRules(rule => {
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
  optimize: async function(ampFile){
    this._removeEmptySelectors(ampFile);
    await this._removeUnusedAmpSelectors(ampFile).catch(err => {throw err});
    await this._handleCommaSeparatedSelectors(ampFile).catch(err => {throw err});
    await this._removeUnusedGeneralSelectors(ampFile).catch(err => {throw err});
    await this._removeUnusedPseudos(ampFile).catch(err => {throw err});
    await this._removeUnusedEscapedPseudos(ampFile).catch(err => {throw err});
    this._removeUnusedKeyframes(ampFile);
    ampFile.setStatus('optimized', performance.now());
    ampFile.setStatus('optLevel',1);
    return ampFile
  }
};

module.exports = typeOneOptimizations;

