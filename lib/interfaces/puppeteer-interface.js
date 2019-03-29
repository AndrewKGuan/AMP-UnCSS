/**
 * @file Class file for interface to Puppeteer
 * @version 0.1
 */

/**
 * Class representing a Puppeteer instance
 */
class PuppeteerInterface {
  /**
   * @param {string} sourceHtmlFilePath
   */
  constructor(sourceHtmlFilePath) {
    this.sourceHtmlFilePath = sourceHtmlFilePath;
  }

  /**
   * Instantiate a new Puppeteer browser page
   * @param {*} browser
   * @return {Promise<PuppeteerInterface>}
   */
  async init(browser) {
    this.browser = browser;

    // Check to see if a Page instance has already been created.
    // If so, wrap it in a promise for consistency sake.
    if (this.page) {
      return Promise.resolve(this.page).catch((e) => {
        throw e;
      });
    }

    this.page = await browser.newPage()
        .then((p) => {
          console.log('Opened a new Puppeteer.page.');
          return p;
        })
        .catch((e) => {
          throw e;
        });

    await this.page.goto(this.sourceHtmlFilePath, {waitUntil: 'load'})
        .catch((e) => {
          throw e;
        });

    // Need to expand all the amp-accordions to load any dynamic content
    //  that is nested inside them.
    await this.clickAllAmpAccordionSections();

    return this;
  }

  /**
   * Close the browser page to keep memory usage to a minimum.
   * @return {Promise<boolean>}
   */
  async shutdown() {
    if (!this.page.isClosed()) {
      await this.page.close().catch((err) => {
        console.log(err);
        throw err;
      });
    }
    return true;
  }

  /**
   * Count the frequency of a given selector on a page.
   * @param {string} selector
   * @return {Promise<number>}
   */
  async count(selector) {
    if (typeof selector === 'string' && selector.length > 0) {
      return this.page.$$(selector)
          .then((elList) => elList.length)
          .catch((err) => {
            throw Error(err);
          });
    } else {
      // Warning: selector not valid. Throw an error and let AmpFile handle.
      throw Error(`Count() expects input type of string with non-zero
      length. Input ${selector} is not string or is an empty string.`);
    }
  }

  /**
   * Get an HTML string representing the current Puppeteer.Page HTML.
   * @return {Promise<string>}
   */
  async getHtml() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const docType = new XMLSerializer().serializeToString(document.doctype);

        const htmlEl = document.getElementsByTagName('html')[0];
        const attrNames = htmlEl.getAttributeNames();

        let attrStr = '';

        attrNames.forEach((name) => {
          attrStr += `${name}="${htmlEl.getAttribute(name)}" `;
        });

        const htmlTag = `<html lang="" ${attrStr} >`;
        const innerText = document.documentElement.innerHTML;
        const fullHtml = docType + htmlTag + innerText
            + '</sourceHtmlFilePath>';
        resolve(fullHtml);
      });
    })
        .catch((err) => {
          console.log('Error during PuppeteerInterface.getHtml: ' + err);
          throw err;
        });
  }

  /**
   * Utilize Puppeteer methods to get meta-data about all given selectors
   * @param {string} selector
   * @return {Promise<{
   *    els: {id: {string},className: {string}}[],
   *    count: number
   * }>}
   */
  async queryAll(selector) {
    if (typeof selector === 'string' && selector.length > 0) {
      const els = {
        els: await this.page.$$eval(selector, (selectedEls) => {
          return selectedEls.map((el) => {
            return {id: el.id, className: el.className};
          });
        })
            .catch((err) => {
              console.log('Error during PuppeteerInterface.queryAll: ' + err);
              throw err;
            }),
        count: 0,
      };

      els.count = els.els.length;
      return els;
    } else {
    // Warning: Selector not valid. Throw an error and let AmpFile handle.
      throw Error(`queryAll() expects input type of string with non-zero
        length. Input ${selector} is not string or is an empty string.`);
    }
  }

  /**
   * Iterate through all <amp-accordion /> elements on the current Page
   *    instance, clicking each section's first element in order to expand the
   *    accordion. Necessary because dynamic content nested inside a closed
   *    <amp-accordion /> section will not load.
   * @return {Promise<!Promise<boolean>>}
   * @todo Create iterator to check for newly loaded dynamic elements? For
   *    example, nested amp-accordions
   */
  async clickAllAmpAccordionSections() {
    return this.page.$$eval('amp-accordion', (accordions) => {
      return new Promise((resolve) => {
        accordions.forEach((accordion) => {
          if (accordion.children.length > 0) {
            Array.from(accordion.children).forEach((section) => {
              section.children[0].click();
            });
          }
        });

        // setTimeout to provide time for AMP scripts to register the click and
        // render any new content. May need to increase timeout depending on how
        // many nested dynamic calls there are.
        setTimeout(() => {
          resolve(true);
        }, 200);
      });
    });
  }
}

module.exports = PuppeteerInterface;
