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
   * @return {Object}
   */
  extractDom: async function(fileName){
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
   * @return {Object}
   */
  _getSelectors: function($){

    let selectors = {
      ampElementSelectors: new Set(),
      attributeSelectors: new Set(),
      classSelectors: new Set(),
      elementSelectors: new Set(),
      emptySelectors: new Set(),
      idSelectors: new Set(),
      nestedSelectors: new Set(),
    };

    const styleTags = $('style');
    styleTags.forEach(styleTag => {
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

                /**
                 * List of discrete selectors
                 * @example
                 * // underlined hyperlink
                 * "a.underlined"
                 * @example
                 * // nested <p>
                 * ".card-container.grid .card-link p"
                 * @type {Array<String>}
                 */
                // Check to see if selector is empty;
                if(rule.declarations.length === 0){
                  selectors.emptySelectors.add(rule)
                }

                let selectors = rule.selectors;
                selectors.forEach(selector => {
                  // check for a nested selector;
                  if(selector.split(' ').length > 1){
                    // Selector has at least one nested element
                    selectors.nestedSelectors.add(selector);
                  }
                  selector.split(' ').forEach(nestedSelector => {
                    nestedSelector.split(classOrIdSearch).forEach((selectorPart, index, arr) => {
                      // Split nested selector on "." or "#"
                      if(selectorPart === "") return;
                      const prevPart = arr[index];
                      if ( prevPart === '.') {
                        // selector is a .class selector
                        selectors.classSelectors.add(nestedSelector);
                      }
                      if (prevPart === '#') {
                        // selector is an #id selector
                        selectors.idSelectors.add(nestedSelector);
                      }
                      /**
                       * @Todo: Do we need need to add additional handling for'>' or other selector types?
                       */
                      if (tags.allTags.has(selectorPart)){
                        selectors.elementSelectors.add(selectorPart)
                      }
                      if (tags.ampTags.has(selectorPart)) {
                        selectors.ampElementSelectors.add(selectorPart)
                      }
                      if (selectorPart.match(attrSearch)){
                        // An attribute selector ('[selector="value"]') exists
                        // Capture just the "value"
                        selectors.attributeSelectors.add(selectorPart.match(attrSearch)[1]);
                      }
                    })
                  })
                });
              }
            })
          }
        }
      })
    })

  },

  /**
   * Return a Set of element selectors used in inline styles and <style> tag
   *    declaration blocks
   * @param {Object} dom
   * @return {Set<Object>}
   */
  getElementSelectors: function(dom){},

  /**
   * Return a Set of attribute selectors used in inline styles and <style>
   *    tag declaration blocks
   * @param {Object} dom
   * @return {Set<Object>}
   */
  getAttributeSelectors: function(dom){},

  /**
   * Return a Set of classes and element tags used
   * @param {Object} dom
   * @return {{Object}<string, Set<Object>>}
   */
  getClassesAndElements: function(dom){},


  buildDomFromFile: function(fileName) {
    const stream = fs.readFileSync(fileName);
    return cheerio.load(stream);
  }

};

module.exports = DomParser;