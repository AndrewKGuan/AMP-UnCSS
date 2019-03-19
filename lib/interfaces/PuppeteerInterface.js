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
    this.browser = browser

    if(this.page) return Promise.resolve(this.page).catch(e => {throw e});
    const {html} = this;

    this.page = await browser.newPage().catch(e => {throw e});
    await this.page.goto(html,
        {
          waitUntil: 'load'
        })
        .catch(e => {throw e});

    await this.clickAllAmpAccordionSections();

    return this
  }

  async shutdown() {
    if(!this.page.isClosed()) {
      await this.page.close().catch(err => {
        console.log(err)
        throw err
      });
    }
    return true
  }


  async count(selectors) {
    return this.page.$$(selectors)
        .then(elList => elList.length)
        .catch(err => {throw Error(err)})
  }

  async removeCustomStyles() {
    await this.page.evaluate(() => {
      console.log('Removing Styles')
      return new Promise((resolve, reject) => {
        document.querySelectorAll('style[amp-custom=""]')
            .forEach(node => {
              console.log(node)
              node.parentNode.removeChild(node);
            });
        resolve(true);
      })
    })
    .catch(err => {
      console.log("Couldn't removeCustomStyles()");
      console.log(err);
      throw err
    });
  }

  async appendCustomStyle(html) {
    await this.page.evaluate((html) => {
      return new Promise((res, rej) => {
        let head = document.head || document.getElementsByTagName('head')[0]
        let style = document.createElement('style');
        style.setAttribute('amp-custom', '');
        style.type = 'text/css';
        style.innerHTML = html;
        head.appendChild(style);
        let newHeadSuccessfullyAppended = !!document.querySelector('style[amp-custom=""]');
        res(newHeadSuccessfullyAppended)
      })
    }, html)
        .catch(err => {
          console.log("Couldn't appendCustomStyles()");
          console.log(err)
          throw err;
        })
  }

  async getHtml() {
    let results =  await this.page.evaluate(() => {
      return new Promise((resolve, reject) => {
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
        resolve(fullHtml);
      })
    })
      .catch(err => {
        console.log("Couldn't getHtml()");
        throw err
      });
    return results
  }

  async queryAll(selectors) {
    let els = {
      els: await this.page.$$eval(selectors, (selectedEls) => {
            return selectedEls.map(el => {
              return {id: el.id, className: el.className}
            })
          })
          .catch(err => {
            throw err
          })
  };
    els.count = els.els.length;
    return els
  }

  async replaceCustomStyles(newStylesString) {
    await this.removeCustomStyles().catch(err => {
      console.log("Could not .removeCustomStyles during replaceCustomStyles:")
      console.log(err)
      throw err
    });
    await this.appendCustomStyle(newStylesString).catch(err => {
      console.log("Could not .removeCustomStyles during replaceCustomStyles:")
      console.log(err)
      throw err
    });
  }

  async clickAllAmpAccordionSections() {
    return this.page.$$eval('amp-accordion', (accordions) => {
      return new Promise((resolve, reject) => {
        accordions.forEach(accordion => {
          if(accordion.children.length > 0) {
            Array.from(accordion.children).forEach(section => {
              section.children[0].click();
            })
          }
        });

        // setTimeout to provide time for AMP scripts to register the click and
        // render any new content. May need to increase timeout depending on how
        // many nested dynamic calls there are.
        // TODO: Create iterator to check for newly loaded dynamic elements? For
        //  example, nested amp-accordions.
        setTimeout(() => {resolve(true)}, 200)
      })
    });
  }
}

module.exports = PupInterface;