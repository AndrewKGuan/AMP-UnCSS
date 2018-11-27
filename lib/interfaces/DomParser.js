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
   * @return {{dom: (* | $ | jQuery | HTMLElement), ampElementSelectors: Set<any>, attributeSelectors: Set<any>, classSelectors: Set<any>, elementSelectors: Set<any>, emptySelectors: Set<any>, idSelectors: Set<any>, nestedSelectors: Set<any>}}
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

    results = {
      ...results,
      ...selectors
    };

    return results;
  },

  /**
   * Return a Set of class selectors used in inline styles and <style> tag
   *    declaration blocks
   * @param {Object} $ cheerio dom object
   * @return {{ampElementSelectors: Set<string>, attributeSelectors: Set<string>, classSelectors: Set<string>, elementSelectors: Set<string>, emptySelectors: Set<string>, idSelectors: Set<string>, nestedSelectors: Set<string>}}
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
    };

    /**
     *
     * @type {* | jQuery | HTMLElement}
     */
    const styleTags = $('style');

    /**
     * An array of style tag definitions
     * @type {Array}
     */
    const styleTagsIterator = Object.keys(styleTags).reduce((acc, key) => {
      if(!isNaN(key)) {
        acc.push(styleTags[key])
      }
      return acc;
    },[]);

    styleTagsIterator.forEach(styleTag => {
      styleTag.children.forEach(({type, data }) => {
        if(type === 'text' && data) {
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

                // Check to see if selector is empty;
                if(rule.declarations.length === 0){
                  cssSelectors.emptySelectors.add(rule)
                }


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
                        cssSelectors.attributeSelectors.add(selectorPart.match(attrSearch)[1]);
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
   * Return a Set of element selectors used in inline styles and <style> tag
   *    declaration blocks
   * @param {Object} dom
   * @return {Set<Object>}
   *
   * @todo potentially unneeded
   */
  getElementSelectors: function(dom){},

  /**
   * Return a Set of attribute selectors used in inline styles and <style>
   *    tag declaration blocks
   * @param {Object} dom
   * @return {Set<Object>}
   * @todo potentially unneeded
   */
  getAttributeSelectors: function(dom){},

  /**
   * Return a Set of classes and element tags used
   * @param {Object} dom
   * @return {{Object}<string, Set<Object>>}
   * @todo potentially unneeded
   */
  getClassesAndElements: function(dom){},

  /**
   * Extracts the DOM via cheerio library
   * @param fileName
   * @return {$} cheerio Dom object
   */
  buildDomFromFile: function(fileName) {

    const stream = fs.readFileSync(fileName);
    return cheerio.load(stream);
  }

};

module.exports = DomParser;