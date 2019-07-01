const assert = require('assert');
const path = require('path');
puppeteer = require('puppeteer');

const PuppeteerInterface = require('../lib/interfaces/puppeteer-interface.js');

const fileLoc = './tests/selectors/static/staticDom.html';

let pageRep = false;
let browser;
describe('PuppeteerInterface', async function() {
  this.timeout(10000);
  before(async () => {
    browser = await puppeteer.launch();
    pageRep = await new PuppeteerInterface(
        path.join('file://', path.resolve('.'), fileLoc)
    ).init(browser);
  });


  it('should execute .init() the first time', async () => {
    assert.ok(pageRep.page);
  });
  it('should shortcut .init() the second time', async () => {
    const page1 = pageRep.page;
    const page2 = await pageRep.init(browser);
    assert.ok(page1 === page2);
  });
  it('should count the correct number of "span"', async () => {
    const count = await pageRep.count('span');
    assert.strictEqual(count, 4);
  });
  it('should count the correct number of ".special-span"', async () => {
    const count = await pageRep.count('.special-span');
    assert.strictEqual(count, 2);
  });
  it('should count the correct number of "#extra-special-span"', async () => {
    const count = await pageRep.count('#extra-special-span');
    assert.strictEqual(count, 1);
  });
  it('should count the correct number of ".unused"', async () => {
    const count = await pageRep.count('.unused');
    assert.strictEqual(count, 0);
  });

  it('should query all the correct elements', async () => {
    const spanQuery = await pageRep.queryAll('span');
    const allQuery = await pageRep.queryAll('*');

    assert.strictEqual(spanQuery.count, 4);
    // There is a good chance that the AMP component scripts are loading extra
    //    scripts on the page. Therefore, consider any return value > 49
    //    correct as that is the number of elements on the page before anything
    //    is loaded.
    assert.ok(allQuery.count > 49);
  });

  // it('should return the correct raw html',async () => {
  //   let pageHtml = await pageRep.getOriginalHtml();
  //   assert.strictEqual(
  //       pageHtml.replace(/\r\n/g, '\n')
  //           .replace(/\n/g,"")
  //           .replace(/\s*/g,'')
  //           .replace(/="{2}/g, ""),
  //       renderedHtml.replace(/\r\n/g, '\n')
  //           .replace(/\n/g,"")
  //           .replace(/\s*/g,'')
  //           .replace(/="{2}/g, ""));
  // });


  after(() => {
    browser.close();
  });
});
