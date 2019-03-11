/**
 * @file Class file for interface to Puppeteer
 * @version 0.1
 */

const puppeteer = require('puppeteer');

/**
 * Class representing a Puppeteer instance
 */

class PupInterface {
  constructor(html) {
    this.html = html;
  }

  async init(browser) {
    // Check to see if the Puppeteer instance has already been created.
    // If so, wrap it in a promise for consistency sake
    if(this.page) return Promise.resolve(this.page);

    const {html} = this;

    this.page = await browser.newPage();
    await this.page.setContent(html, {waitUntil: 'networkidle2'});

    return this
  }

  async shutdown() {
    await this.page.close();
    return true
  }

  /**
   * Returns the first Element within the document that matches the specified selector, or group of selectors.
   * @param {String} selectors
   * @return Element
   */
  async queryOne(selectors) {
    return await this.page.evaluate((selectors) => {
      return document.querySelector(selectors)
    }, selectors);
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
        return x;
      });
      return elsList
    }, selectors);
  }

  async count(selectors) {
    const elList = await this.page.$$(selectors);
    return elList.length;
  }
}

module.exports = PupInterface;