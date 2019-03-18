const assert = require('assert'),
    fs = require('fs'),
    path = require('path')
    puppeteer = require('puppeteer');

const pupInt = require('../lib/interfaces/PuppeteerInterface');

const fileLoc = './tests/selectors/static/staticDom.html';
const fileLoc2 = './tests/selectors/rendered.html';
const html = fs.readFileSync(fileLoc, 'utf-8');
const renderedHtml = fs.readFileSync(fileLoc2, 'utf-8');

let pageRep = false;
let browser;
describe('PuppeteerInterface', async function() {
  this.timeout(10000)
  before(async () => {
    browser = await puppeteer.launch()
    pageRep = await new pupInt(
        path.join('file://', path.resolve('.'), fileLoc)
    ).init(browser)
  });


  it('should execute .init() the first time', async () => {
    assert.ok(pageRep.page);
  });
  it('should shortcut .init() the second time', async () => {
    const page1 = pageRep.page;
    const page2  = await pageRep.init(browser);
    assert.ok(page1 === page2);
  });
  it('should count the correct number of "span"', async () => {
    let count = await pageRep.count('span');
    assert.strictEqual(count, 4)
  });
  it('should count the correct number of ".special-span"', async () => {
    let count = await pageRep.count('.special-span');
    assert.strictEqual(count, 2)
  });
  it('should count the correct number of "#extra-special-span"', async () => {
    let count = await pageRep.count('#extra-special-span');
    assert.strictEqual(count, 1)
  });
  it('should count the correct number of ".unused"', async () => {
    let count = await pageRep.count('.unused');
    assert.strictEqual(count, 0)
  });

  it('should query all the correct elements', async () => {
    let spanQuery = await pageRep.queryAll('span');
    let allQuery = await pageRep.queryAll('*');

    assert.strictEqual(spanQuery.count, 4);

    // If this fails, rerun test with after() block commented out.
    // There is a good chance that the AMP component scripts are loading extra
    // scripts on the page. Therefore this test will be flaky as long as script
    // behavior is variable. Have seen query return anywhere between 49 and 56
    // elements.
    assert.strictEqual(allQuery.count, 49)
  });

  // it('should return the correct raw html',async () => {
  //   let pageHtml = await pageRep.getHtml();
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

  it('should remove custom styles', async function() {
    assert.strictEqual(await pageRep.count('style[amp-custom=""]'),1);
    await pageRep.removeCustomStyles();
    assert.strictEqual(await pageRep.count('style[amp-custom=""]'),0)
  });

  it('should append custom style', async () => {
    assert.strictEqual(await pageRep.count('style[amp-custom=""]'),0)
    await pageRep.appendCustomStyle("h1{color: blue}")
    assert.strictEqual(await pageRep.count('style[amp-custom=""]'),1)
  });

  after(() => {
    browser.close();
  });
});
