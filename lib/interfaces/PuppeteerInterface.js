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
    if(this.page) return Promise.resolve(this.page).catch(e => {throw e});

    const {html} = this;

    this.page = await browser.newPage().catch(e => {throw e});
    await this.page.setContent(html,
        {
          waitUntil: 'networkidle2'

        }).catch(e => {throw e});

    return this
  }

  async shutdown() {
    await this.page.close().catch(e => {throw e});
    return true
  }


  async count(selectors) {
    return this.page.$$(selectors)
        .then(elList => elList.length)
        .catch(err => {throw Error(err)})
  }

  async removeCustomStyles() {
    return await this.page.evaluate(() => {
      document.querySelectorAll('style[amp-custom=""]')
          .forEach(node => {
            node.parentNode.removeChild(node);
          })
    })
    .catch(err => {
      throw err;
    });
  }

  async appendCustomStyle(html) {
    await this.page.evaluate((html) => {
      let head = document.head || document.getElementsByTagName('head')[0]
      let style = document.createElement('style');
      style.setAttribute('amp-custom', '');
      style.type = 'text/css';
      style.innerHTML = html;
      head.appendChild(style);
    }, html)
        .then(x => x)
        .catch(err => {
          throw err;
        })
  }

  async getHtml() {
    return await this.page.evaluate(() => {
      let docType = new XMLSerializer().serializeToString(document.doctype);

      let htmlEl = document.getElementsByTagName('html')[0]
      let attrNames = htmlEl.getAttributeNames();

      let attrStr = '';

      attrNames.forEach(name => {
        attrStr += `${name}="${htmlEl.getAttribute(name)}" `
      });

      let htmlTag = `<html ${attrStr} >`;
      let innerText = document.documentElement.innerHTML
      let fullHtml = docType + htmlTag + innerText + '</html>';
      return fullHtml;
    })
        .catch(err => {throw err});
  }

  async queryAll(selectors) {
    let els = await this.page.$$(selectors)
        .catch(err => {throw err});
    return els
  }

  async replaceCustomStyles(newStylesString) {
    await this.removeCustomStyles();
    await this.appendCustomStyle(newStylesString);
  }
}

module.exports = PupInterface;