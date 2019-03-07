/**
 * @file Class file for interface to Cheerio
 * @version 0.1
 */

const cheerio = require('cheerio');

/**
 * Class representing a Cheerio instance
 */

class CheerioInterface {
  constructor(html) {
    this.html = html;
  }

  async init() {
    // Check to see if the Cheerio instance has already been created.
    // If so, wrap it in a promise for consistency sake
    if(this.page) return Promise.resolve(this.page);

    try {
      this.page = cheerio.load(this.html);
    }
    catch (e) {
      throw Error(`Cheerio.load error: exited with error ${e}`)
    }

    return this
  }

  async shutdown() {
    return true
  }

  /**
   * Returns the first Element within the document that matches the specified selector, or group of selectors.
   * @param {String} selectors
   * @return Element
   */
  async queryOne(selectors) {
    let temp = await this.page.evaluate((selectors) => {
      let tmp = document.querySelector(selectors)
      console.log(tmp);
      return tmp;
    }, selectors);
    console.log(temp)
    return temp;
  }

  /**
   *
   * @param {String }selectors
   * @return {Promise<*>}
   */
  async queryAll(selectors) {
    return await this.page.evaluate((selectors) => {
      let els = document.querySelectorAll(selectors);
      let elsList = Array.from(els).map(x => {
        console.log(Object.getPrototypeOf(x));
        console.log(x);
        return x;
      });
      return elsList
    }, selectors);
  }

  async count(selectors) {
    return this.page(selectors).toArray().length;
  }

  evaluate(cb) {
    return cb(this.page)
  }

  async prepend(contextSelector, html){}
  async append(contextSelector, html){}
  async insert(contextSelector, html){}

}

module.exports = CheerioInterface;