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
 * @file Class file for interface to Cheerio
 * @version 0.1
 */

const cheerio = require('cheerio');
const tags = require('../utils/tags');
const stubs = require('../utils/stubs');

/**
 * Class representing a Cheerio instance
 */
class CheerioInterface {
  /**
   * @param {string} html
   */
  constructor(html) {
    this.html = html;
  }

  /**
   * Loads HTML into cheerio.
   * @return {*}
   */
  init() {
    // Check to see if the Cheerio instance has already been created.
    // If so, wrap it in a promise for consistency sake
    if (this.page) return this.page;

    this.page = cheerio.load(this.html);
    return this;
  }

  /**
   * Query
   * @param {String }selectors
   * @return {* | T[]}
   */
  queryAll(selectors) {
    try {
      return this.page(selectors).toArray();
    } catch (err) {
      throw Error(e);
    }
  }

  /**
   * @param {string} selectors
   * @return {number}
   */
  count(selectors) {
    try {
      return this.page(selectors).toArray().length;
    } catch (e) {
      throw Error(e);
    }
  }

  /**
   * @param {string} contextSelector
   * @param {string} html
   */
  append(contextSelector, html) {
    this.page(contextSelector).append(html);
  }

  /**
   * Return an array of CSS style nodes
   * @return {*|T[]}
   */
  getCustomStyles() {
    return this.page('style')
        .not('[amp-boilerplate=""]')
        .not('[amp-keyframes=""]')
        .toArray();
  }

  /**
   * @return {Set<string>}
   */
  getExceptionTags() {
    const exceptions = new Set();
    tags.exceptionTags.forEach((el) => {
      if (this.page(el).toArray().length > 0) {
        exceptions.add(el);
      }
    });
    return exceptions;
  }

  /**
   * Get raw html string from Cheerio DOM
   * @return {string}
   */
  getHtml() {
    return this.page.html();
  }

  /**
   * In order to handle amp-image tags without instantiating a more costly
   *  Puppeteer interface, we have to insert img tags into each amp-img element
   *  on the page.
   */
  stubAmpImg() {
    this.page('amp-img').append('<img src="" >');
  }

  /**
   * Remove all the img stubs to revert to initial state.
   */
  removeAmpImgStubs() {
    this.page('img').remove();
  }

  /**
   * Remove any ```<style ...>``` tags from the HTML document. This
   *  implementation assumes that only two ```<style ...>``` tags exist on a
   *  given HTML page - ```<style amp-boilerplate />``` and
   *  ```<style amp-custom>```;
   */
  removeCustomStyles() {
    this.page('style')
        .not('[amp-boilerplate=""]')
        .not('[amp-keyframes=""]')
        .remove();
  }

  /**
   * Replace existing ```<style amp-custom/>``` tag with the newly optimized
   *  version.
   * @param {string} newCssDefinitionsString
   */
  replaceCustomStyles(newCssDefinitionsString) {
    this.removeCustomStyles();
    this.append('head',
        `<style amp-custom>${newCssDefinitionsString}</style>`);
  }

  /**
   * Iterate through all elements. If any of them are AMP elements, run the
   *    appropriate stubbing function.
   */
  insertAmpStubs() {
    const stubElements = Object.keys(stubs);

    this.page('*').each((i, elem) => {
      // Check that element is a tag element and exists in the stub list
      if (elem.type==='tag' && stubElements[elem.name]) {
        // Execute appropriate stub function on the element.
        stubs[elem.name](elem);
      }
    });
  }

  /**
   * Creates a new element node
   * @function
   * @static
   * @param str - descriptor of new node
   * @return {* | * | * | * | *}
   */
  static createNode(str) {
    return cheerio(str);
  }
}

module.exports = CheerioInterface;
