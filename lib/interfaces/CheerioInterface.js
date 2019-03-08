/**
 * @file Class file for interface to Cheerio
 * @version 0.1
 */

const cheerio = require('cheerio'),
    tags = require('../utils/tags');

/**
 * Class representing a Cheerio instance
 */

class CheerioInterface {
  constructor(html) {
    this.html = html;
  }

  init() {
    // Check to see if the Cheerio instance has already been created.
    // If so, wrap it in a promise for consistency sake
    if(this.page) return this.page;

    this.page = cheerio.load(this.html);
    return this
  }

  /**
   * Returns the first Element within the document that matches the specified selector, or group of selectors.
   * @param {String} selectors
   * @return Element
   */
  async queryOne(selectors) {}

  /**
   *
   * @param {String }selectors
   * @return {* | T[]}
   */
  queryAll(selectors) {
    return this.page(selectors).toArray()
  }

  count(selectors) {
    return this.page(selectors).toArray().length;
  }

  prepend(contextSelector, html){}

  append(contextSelector, html){
    this.page(contextSelector).append(html)
  }

  insert(contextSelector, html){}

  getCustomStyles() {
    return this.page("style").not("[amp-boilerplate='']").toArray()
  }

  getExceptionTags() {
    const exceptions = new Set();
    tags.exceptionTags.forEach(el => {
      if(this.page(el).toArray().length > 0) {
        exceptions.add(el);
      }
    });
    return exceptions;
  }

  getHtml() {
    return this.page.html();
  }

  stubAmpImg() {
    this.page('amp-img').append('<img src="" >')
  }

  removeCustomStyles() {
    this.page("style").not("[amp-boilerplate='']").remove()
  }


}

module.exports = CheerioInterface;