/**
 * @file DOM parsing interface to decouple core code from any library leveraged
 * @version 0.1
 * @requires cheerio
 * @requires css
 * @requires fs
 */

const postCss = require('postcss');

const atRuleHandlers = require('../utils/atrule-helpers.js');
const tags = require('../utils/tags.js');

const DomParser = {
  /**
   * Build a static DOM representation of HTML file
   * @param {CheerioInterface} staticDom
   * @return {{
   *  ampElementSelectors: Set<string>,
   *  commaSeparatedSelectors: Set<Object>,
   *  escapedPseudos: Set<string>,
   *  general: Set<string>,
   *  keyFrames: Set<string>,
   *  polyFills: Set<string>,
   *  pseudos: Set<string>,
   *  }}
   */
  extractDomData: function(staticDom) {
    const results = {
      ampElementSelectors: new Set(),
      commaSeparatedSelectors: new Set(),
      escapedPseudos: new Set(),
      general: new Set(),
      keyFrames: new Set(),
      polyFills: new Set(),
      pseudos: new Set(),
    };


    const selectors = this._getSelectors(staticDom);
    const exceptionElementTags = staticDom.getExceptionTags();

    return Object.assign(
        {},
        results,
        selectors,
        {exceptionElementTags}
    );
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
  _getSelectors: function(dom) {
    /**
     * A set of all css selectors included in the .html document's <style> tags.
     */
    const cssSelectors = {
      polyFills: new Set(),
      escapedPseudos: new Set(),
      pseudos: new Set(),
      general: new Set(),
      commaSeparatedSelectors: new Set(),
      ampElementSelectors: new Set(),
      joinedRawCss: '',
      keyFrames: new Set(),
    };


    /**
     * An array of style tag definitions
     * @type {Array}
     */
    const customStyleTags = dom.getCustomStyles();
    customStyleTags.forEach((styleTag) => {
      styleTag.children.forEach(({type, data}) => {
        if (type === 'text' && data) {
          cssSelectors.joinedRawCss += data;
          const cssRoot = postCss.parse(data);

          /**
           * Iterate over ever rule in the Root node. Rules {enum{string}} can
           *  be 'root', 'atrule', 'rule', 'decl', or 'comment'. We only care
           *  about rules because those have the selector. We will iterate
           *  through atRules and comments later and delete those.
           */
          cssRoot.walk((node) => {
            (function dig(currNode) {
              if (currNode.type === 'rule') {
                if (
                  currNode.parent &&
                  currNode.parent.type &&
                  currNode.parent.type !== 'atrule') {
                  DomParser._handleRuleNode(currNode, cssSelectors);
                }
              } else if (currNode.type === 'atrule') {
                if (typeof atRuleHandlers[currNode.name] === 'boolean') {
                  if (atRuleHandlers[currNode.name]) {
                    currNode.walk(dig);
                  }
                } else if (typeof atRuleHandlers[currNode.name]==='function') {
                  atRuleHandlers[currNode.name](currNode, cssSelectors);
                }
              }
            })(node);
          });
        }
      });
    });

    return cssSelectors;
  },

  /**
   * See if the given selector contains a pseudo
   * @param {string} selector
   * @return {boolean}
   * @private
   */
  _containsPseudo(selector) {
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
      ':first-letter',
    ];

    // Actual regex is of the format: /^(:hover|:focus|...)$/i
    // TODO: Write better regex to search for variable number of ":"'s so that
    // we don't need to manually add single and double colon versions of each
    // pseudo.
    const pseudosRegex = new RegExp('(' + ignoredPseudos.join('|') + ')', 'i');

    return pseudosRegex.test(selector);
  },

  /**
   * See if the given selector contains an escaped pseudo
   * @param {string} selector
   * @return {boolean}
   * @private
   */
  _containsEscapedPseudo(selector) {
    return new RegExp(/\\/g).test(selector);
  },

  _isPolyFill(selector) {
    return new RegExp(/::?-(?:moz|ms|webkit|o)-[a-z0-9-]+/, 'i').test(selector);
  },

  _isAmp(selector) {
    return tags.ampTags.has(selector);
  },

  /**
   * Iterates over the selectors and puts them into correct cssSelectors Set.
   * @param {Object} node
   * @param {Object} cssSelectors
   */
  _handleRuleNode(node, cssSelectors) {
    const {selector, selectors} = node;

    if (selectors.length > 1) {
      cssSelectors.commaSeparatedSelectors.add({
        selectorStr: node.selector,
        selectorsList: node.selectors,
        isUsed: false,
      });
      return;
    }

    if (DomParser._isPolyFill(selector)) {
      // Don't actually need to do anything with them since we can assume
      //    they are used, but we'll bucket it anyway..
      cssSelectors.polyFills.add(selector);
    } else if (DomParser._containsEscapedPseudo(selector)) {
      cssSelectors.escapedPseudos.add(selector);
    } else if (DomParser._containsPseudo(selector)) {
      cssSelectors.pseudos.add({
        base: selector.split(':').shift(),
        modifier: ':' + selector.split(':').slice(1).join(':'),
      });
    } else if (DomParser._isAmp(selector)) {
      cssSelectors.ampElementSelectors.add(selector);
    } else {
      cssSelectors.general.add(selector);
    }
  },
};


module.exports = DomParser;
