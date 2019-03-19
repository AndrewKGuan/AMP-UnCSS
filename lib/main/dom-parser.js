/**
 * @file DOM parsing interface to decouple core code from any library leveraged
 * @version 0.1
 * @requires cheerio
 * @requires css
 * @requires fs
 */

const fs = require('fs');
const atRuleHandlers = require("../utils/atrule-helpers");
const tags = require('../utils/tags');
const postCss = require('postcss');

const DomParser = {

  /**
   * Build a static DOM representation of HTML file
   * @param {CheerioInterface} staticDom
   * @return {{escapedPseudos: Set<string>,
   *  general: Set<string>,
   *  exceptionElementTags: (* | Set<string>),
   *  dom: (* | jQuery | HTMLElement),
   *  pseudos: Set<string>,
   *  ampElementSelectors: Set<string>,
   *  commaSeparatedSelectors: Set<Object>,
   *  polyFills: Set<string>}}
   */
  extractDomData: function(staticDom){

    let results = {
      polyFills: new Set(),
      escapedPseudos: new Set(),
      pseudos: new Set(),
      general: new Set(),
      commaSeparatedSelectors: new Set(),
      ampElementSelectors: new Set(),
      keyFrames: new Set()
    };


    const selectors = this._getSelectors(staticDom);
    const exceptionElementTags = staticDom.getExceptionTags();

    results = {
      ...results,
      ...selectors,
      exceptionElementTags
    };

    return results;
  },

  /**
   * Return a Set of class selectors used in inline styles and <style> tag
   *    declaration blocks
   * @param {CheerioInterface} dom
   * @return {{
   * escapedPseudos: Set<string>,
   * general: Set<string>,
   * joinedRawCss: string,
   * pseudos: Set<string>,
   * ampElementSelectors: Set<string>,
   * commaSeparatedSelectors: Set<Object>,
   * polyFills: Set<string>,
   * keyFrames: Set<Object>}}
   * @private
   */
  _getSelectors: function(dom){

    /**
     * A set of all css selectors included in the .html document's <style> tags.
     */
    let cssSelectors = {
      polyFills: new Set(),
      escapedPseudos: new Set(),
      pseudos: new Set(),
      general: new Set(),
      commaSeparatedSelectors: new Set(),
      ampElementSelectors: new Set(),
      joinedRawCss: '',
      keyFrames: new Set()
    };


    /**
     * An array of style tag definitions
     * @type {Array}
     */
    const customStyleTags = dom.getCustomStyles();
    customStyleTags.forEach(styleTag => {
      styleTag.children.forEach(({type, data }) => {
        if(type === 'text' && data) {
          cssSelectors.joinedRawCss += data;
          const cssRoot = postCss.parse(data);

          /**
           * Iterate over ever rule in the Root node. Rules {enum{string}} can
           *  be 'root', 'atrule', 'rule', 'decl', or 'comment'. We only care
           *  about rules because those have the selector. We will iterate
           *  through atRules and comments later and delete those.
           */
          cssRoot.walk(node => {
            (function dig(currNode){
              if(currNode.type === 'rule') {
                if(currNode.parent && currNode.parent.type && currNode.parent.type !== 'atrule') {
                  DomParser._handleRuleNode(currNode, cssSelectors);
                }
              } else if (currNode.type === 'atrule') {
                if(typeof atRuleHandlers[currNode.name] === 'boolean'){
                  if(atRuleHandlers[currNode.name]) {
                    currNode.walk(dig)
                  }
                } else if (typeof atRuleHandlers[currNode.name] === 'function'){
                  atRuleHandlers[currNode.name](currNode, cssSelectors);
                }
              }
            })(node)
          });
        }
      })
    });

    return cssSelectors;
  },

  /**
   * Extracts the DOM via cheerio library
   * @return {*} cheerio Dom object
   * @param {string} content - content of HTML file
   */
  _loadContent: function (content) {},

  /**
   * Checks against list of exception elements that occur on page.
   * @param $
   * @return {Set<string>}
   * @private
   */
  _getExceptionElementTags: function($) {
    const exceptions = new Set();
    tags.exceptionTags.forEach(el => {
      if($(el).toArray().length > 0) {
        exceptions.add(el);
      }
    });
    return exceptions;
  },

  _hasPseudo(selector) {
    const ignoredPseudos = [
      /* link */
      ':link', ':visited',
      /* user action */
      ':hover', ':active', ':focus', ':focus-within',
      /* UI element states */
      ':enabled', ':disabled', ':checked', ':indeterminate',
      /* form validation */
      ':required', ':invalid', ':valid',
      /* pseudo elements */
      '::first-line', '::first-letter', '::selection', '::before', '::after',
      /* pseudo classes */
      ':target',
      /* CSS2 pseudo elements */
      ':before', ':after',
      /* Vendor-specific pseudo-elements:
       * https://developer.mozilla.org/ja/docs/Glossary/Vendor_Prefix
       */
      '::?-(?:moz|ms|webkit|o)-[a-z0-9-]+',
       /* language formatting */
      ':lang',
      ':placeholder-shown',
      '::placeholder',
      ':first-letter'
    ];

    // Actual regex is of the format: /^(:hover|:focus|...)$/i
    // TODO: Write better regex to search for variable number of ":"'s so that
    // we don't need to manually add single and double colon versions of each
    // pseudo.
    const pseudosRegex = new RegExp('(' + ignoredPseudos.join('|') + ')', 'i');

    return pseudosRegex.test(selector)
  },

  _hasEscapedPseudo(selector) {
    return new RegExp(/\\/g).test(selector);
  },

  _isPolyFill(selector) {
    return new RegExp(/::?-(?:moz|ms|webkit|o)-[a-z0-9-]+/, 'i').test(selector);
  },

  _isAmp(selector) {
    return tags.ampTags.has(selector)
  },

  /**
   * Iterates over the selectors and puts them into correct cssSelectors Set.
   * @param node
   * @param cssSelectors
   */
  _handleRuleNode(node, cssSelectors){
    const {selector, selectors} = node;

    if(selectors.length > 1) {
      cssSelectors.commaSeparatedSelectors.add({
        selectorStr: node.selector,
        selectorsList: node.selectors,
        isUsed: false
      });
      return
    }

    if (DomParser._isPolyFill(selector)) {
      /** Don't actually need to do anything with them since we can assume
       * they are used, but we'll bucket it anyway...
       */
      cssSelectors.polyFills.add(selector)
    } else if (DomParser._hasEscapedPseudo(selector)) {
      /**
       * Escaped pseduo handling is currently busted.
       * TODO: Figure out how to handle escaped pseudos
       * */
      cssSelectors.escapedPseudos.add(selector);
    } else if (DomParser._hasPseudo(selector)) {
      /**
       * May want to abstract pseudo list into config file for easier
       * maintenance.
       */
      cssSelectors.pseudos.add({
            base: selector.split(':').shift(),
            modifier: ':' + selector.split(':').slice(1).join(':')
      });
    } else if (DomParser._isAmp(selector)) {
      cssSelectors.ampElementSelectors.add(selector)
    } else {
      cssSelectors.general.add(selector);
    }
  }
};


module.exports = DomParser;