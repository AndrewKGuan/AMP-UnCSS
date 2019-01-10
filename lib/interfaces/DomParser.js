/**
 * @file DOM parsing interface to decouple core code from any library leveraged
 * @version 0.1
 * @requires cheerio
 * @requires css
 * @requires fs
 */

const { load } = require('cheerio');
const fs = require('fs');
const tags = require('../utils/tags');
const postCss = require('postcss');

// Regex expressions
const classOrIdSearch = /(\.|\#)/;
const attrSearch = /\[\w*.?\=+\"(.*)\"\]/;


const DomParser = {

  /**
   * Build a static DOM representation of HTML file
   * @param {AmpFile} ampFile
   * @return {{dom: (* | jQuery | HTMLElement), ampElementSelectors: Set<any>, attributeSelectors: Set<any>, classSelectors: Set<any>, elementSelectors: Set<any>, emptySelectors: Set<any>, idSelectors: Set<any>, nestedSelectors: Set<any>, exceptionElementTags: (* | Set<string>)}}
   */
  extractDomData: function(ampFile){

    const content = ampFile.type === 'streamable' ?
        String(ampFile.rawHtml) :
        fs.readFileSync(ampFile.filePath);


    const $ = this._loadContent(content);
    let results = {
      dom: $,
      ampElementSelectors: new Set(),
      attributeSelectors: new Set(),
      classSelectors: new Set(),
      elementSelectors: new Set(),
      emptySelectors: new Set(),
      idSelectors: new Set(),
      nestedSelectors: new Set(),
    };


    const selectors = this._getSelectors($);
    const exceptionElementTags = this._getExceptionElementTags($);

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
   * @param {Object} $ cheerio $ object
   * @return {{ampElementSelectors: Set<string>, attributeSelectors: Set<string>, classSelectors: Set<string>, elementSelectors: Set<string>, emptySelectors: Set<Object>, idSelectors: Set<string>, joinedRawCss: string, nestedSelectors: Set<string>}}
   * @private
   */
  _getSelectors: function($){

    /**
     * A set of all css selectors included in the .html document's <style> tags.
     * @type {{
     *    ampElementSelectors: Set<string>,
     *    attributeSelectors: Set<string>,
     *    classSelectors: Set<string>,
     *    elementSelectors: Set<string>,
     *    emptySelectors: Set<Object>,
     *    idSelectors: Set<string>,
     *    joinedRawCss: string,
     *    nestedSelectors: Set<string>}}
     */
    let cssSelectors = {
      ampElementSelectors: new Set(),
      attributeSelectors: new Set(),
      classSelectors: new Set(),
      elementSelectors: new Set(),
      emptySelectors: new Set(),
      idSelectors: new Set(),
      nestedSelectors: new Set(),
      joinedRawCss: '',
    };

    /**
     * Iterates over the selectors and puts them into correct cssSelectors Set.
     * @param node
     */
    const handleRuleNode = function(node){
      /**
       * List of discrete selectors
       * @example
       * // underlined hyperlink
       * "a.underlined"
       * @example
       * // nested <p>
       * ".card-container.grid .card-link p"
       * @type {* | Array<string>}
       */
      node.selectors.forEach(selector => {
        // check for a nested selector;
        if(selector.split(' ').length > 1){
          // Selector has at least one nested element
          cssSelectors.nestedSelectors.add(selector);
        }
        selector.split(' ').forEach(nestedSelector => {
          nestedSelector.split(classOrIdSearch).forEach((selectorPart, index, arr) => {

            // Split nested selector on "." or "#"
            if(selectorPart === "") return;

            let selectorSansPseudos = selectorPart.split(":").shift();

            const prevPart = arr[index - 1];
            if ( prevPart === '.') {
              // selector is a .class selector

              //check for pseudo-element as they are not supported by Cheerio
              cssSelectors.classSelectors.add(selectorSansPseudos);
            }
            if (prevPart === '#') {
              // selector is an #id selector
              cssSelectors.idSelectors.add(selectorSansPseudos);
            }
            /**
             * @Todo: Do we need need to add additional handling for'>' or other selector types?
             */
            if (tags.allTags.has(selectorSansPseudos)){
              cssSelectors.elementSelectors.add(selectorSansPseudos);
            }
            if (tags.ampTags.has(selectorSansPseudos)) {
              cssSelectors.ampElementSelectors.add(selectorSansPseudos)
            }
            if (selectorPart.match(attrSearch)){
              // An attribute selector ('[selector="value"]') exists
              // Capture just the "value"
              cssSelectors.attributeSelectors.add(selectorPart);
            }
          })
        })
      });
    };

    /**
     * All <style> tags in the HTML document that are not <style amp-boilerplate>
     * @type {* | jQuery}
     */
    const styleTags = $("style").not("[amp-boilerplate='']");

    /**
     * An array of style tag definitions
     * @type {Array}
     */
    const styleTagsIterator = styleTags.toArray();
    styleTagsIterator.forEach(styleTag => {
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
          cssRoot.walk((node, index) => {
            if (node.type === 'rule') {
              handleRuleNode(node);
            }
            else if (node.type === 'atrule') {
              const isMediaQuery = node.name === 'media'; // for potential use later
              const mediaQuery = node.params || null; // for potential use later
              node.walk(childNode => {
                if (childNode.type === 'rule') {
                  handleRuleNode(childNode);
                }
              })
            }
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
  _loadContent: function (content) {

      try {
        return load(content);
      }
      catch (e) {
        throw `Cheerio.load error: Exited with error ${e}`
      }
  },

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
  }
};

module.exports = DomParser;