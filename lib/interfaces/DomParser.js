/**
 * @file DOM parsing interface to decouple core code from any library leveraged
 * @version 0.1
 * @requires cheerio
 * @requires css
 * @requires fs
 */

const cheerio = require('cheerio');
const CSS = require('css');
const fs = require('fs');
const tags = require('../utils/tags');

// Regex expressions
const classOrIdSearch = /(\.|\#)/;
const attrSearch = /\[\w*.?\=+\"(.*)\"\]/;


const DomParser = {

  /**
   * Build a static DOM representation of HTML file
   * @param {string} fileName
   * @return {{
   *   dom: (* | Function | jQuery | HTMLElement),
   *   ampElementSelectors: Set<string>,
   *   attributeSelectors: Set<string>,
   *   classSelectors: Set<string>,
   *   elementSelectors: Set<string>,
   *   emptySelectors: Set<any>,
   *   idSelectors: Set<string>,
   *   nestedSelectors: Set<string>,
   *   joinedRawCss: string,
   *   exceptionElementTags: (* | Set<string>)}}
   */
  extractDomData: function(fileName){
    const $ =  this.buildDomFromFile(fileName);


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
    // Extract all style declarations into object,
    const selectors = this._getSelectors($);
    // const styleRoot = this._getStyleRoot($);
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
   * @return {{ampElementSelectors: Set<string>,
   *    attributeSelectors: Set<string>,
   *    classSelectors: Set<string>,
   *    elementSelectors: Set<string>,
   *    emptySelectors: Set<Object>,
   *    idSelectors: Set<string>,
   *    joinedRawCss: string,
   *    nestedSelectors: Set<string>}}
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
     * All <style> tags in the HTML document that are not <style amp-boilerplate>
     * @type {* | jQuery | HTMLElement}
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
          const cssData = CSS.parse(data);
          if (cssData.type === 'stylesheet' && cssData.stylesheet) {
            cssData.stylesheet.rules.forEach(rule => {

              /**
               * Enum for rule type: rule, media,
               * @readonly
               * @enum {string}
               */
              const ruleType = rule.type;
              if(ruleType === 'rule') {

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
                let selectors = rule.selectors;
                selectors.forEach(selector => {
                  // check for a nested selector;
                  if(selector.split(' ').length > 1){
                    // Selector has at least one nested element
                    cssSelectors.nestedSelectors.add(selector);
                  }
                  selector.split(' ').forEach(nestedSelector => {
                    nestedSelector.split(classOrIdSearch).forEach((selectorPart, index, arr) => {
                      // Split nested selector on "." or "#"
                      if(selectorPart === "") return;
                      const prevPart = arr[index - 1];
                      if ( prevPart === '.') {
                        // selector is a .class selector
                        cssSelectors.classSelectors.add(selectorPart);
                      }
                      if (prevPart === '#') {
                        // selector is an #id selector
                        cssSelectors.idSelectors.add(selectorPart);
                      }
                      /**
                       * @Todo: Do we need need to add additional handling for'>' or other selector types?
                       */
                      if (tags.allTags.has(selectorPart)){
                        cssSelectors.elementSelectors.add(selectorPart);
                      }
                      if (tags.ampTags.has(selectorPart)) {
                        cssSelectors.ampElementSelectors.add(selectorPart)
                      }
                      if (selectorPart.match(attrSearch)){
                        // An attribute selector ('[selector="value"]') exists
                        // Capture just the "value"
                        cssSelectors.attributeSelectors.add(selectorPart);
                      }
                    })
                  })
                });
              }
            })
          }
        }
      })
    });
    return cssSelectors;
  },



  /**
   * Extracts the DOM via cheerio library
   * @param fileName
   * @return {Function} cheerio Dom object
   */
  buildDomFromFile: function(fileName) {
    const stream = fs.readFileSync(fileName);
    return cheerio.load(stream);
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