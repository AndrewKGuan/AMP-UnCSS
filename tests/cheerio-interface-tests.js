const assert = require('assert');
const fs = require('fs');
const CheerioInt = require('../lib/interfaces/cheerio-interface');

const fileLoc = './tests/selectors/static/staticDom.html';
const html = fs.readFileSync(fileLoc, 'utf-8');

const fakeAmpFile = {
  selectorWhiteList: [],
};


describe('CheerioInterface', () => {
  const pageRep = new CheerioInt(html).init(fakeAmpFile);

  it('should execute .init() the first time', () => {
    assert.ok(pageRep.page);
  });
  it('should shortcut .init() the second time', () => {
    const page1 = pageRep.page;
    const page2 = pageRep.init();
    assert.ok(page1 === page2);
  });
  it('should count the correct number of "span"', () => {
    const count = pageRep.page('span').toArray().length;
    assert.strictEqual(count, 6);
  });
  it('should count the correct number of ".special-span"', () => {
    const count = pageRep.page('.special-span').toArray().length;
    assert.strictEqual(count, 2);
  });
  it('should count the correct number of "#extra-special-span"', () => {
    const count = pageRep.page('#extra-special-span').toArray().length;
    assert.strictEqual(count, 1);
  });
  it('should count the correct number of ".unused"', () => {
    const count = pageRep.page('.unused').toArray().length;
    assert.strictEqual(count, 0);
  });
  it('should return the correct raw html', () => {
    const pageHtml = pageRep.getOriginalHtml();
    assert.strictEqual(
        pageHtml.replace(/\r\n/g, '\n')
            .replace(/\n/g, '')
            .replace(/\s*/g, '')
            .replace(/="{2}/g, ''),
        html.replace(/\r\n/g, '\n')
            .replace(/\n/g, '')
            .replace(/\s*/g, '')
            .replace(/="{2}/g, ''));
  });


  it('should remove custom styles', () => {
    assert.strictEqual(
        pageRep.page('style[amp-custom=""]').toArray().length,
        1);
    pageRep.removeCustomStyles();
    assert.strictEqual(
        pageRep.page('style[amp-custom=""]').toArray().length,
        0);
  });

  it('should append custom style', () => {
    assert.strictEqual(
        pageRep.page('style[amp-custom=""]').toArray().length,
        0);
    pageRep.appendOriginal('head', '<style amp-custom>h1{color: blue}</style>');
    assert.strictEqual(
        pageRep.page('style[amp-custom=""]').toArray().length,
        1);
  });
});
