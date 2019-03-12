const assert = require('assert');
const fs = require('fs');
const cheerioInt = require('../lib/interfaces/CheerioInterface');

const fileLoc = './tests/selectors/staticDom.html';
const html = fs.readFileSync(fileLoc, 'utf-8')


describe('CheerioInterface', () => {

  const pageRep = new cheerioInt(html).init();

  it('should execute .init() the first time', () => {
    assert.ok(pageRep.page);
  });
  it('should shortcut .init() the second time', () => {
    const page1 = pageRep.page;
    const page2  =  pageRep.init();
    assert.ok(page1 === page2);
  });
  it('should count the correct number of "span"', () => {
    let count =  pageRep.count('span');
    assert.strictEqual(count, 4)
  });
  it('should count the correct number of ".special-span"', () => {
    let count =  pageRep.count('.special-span');
    assert.strictEqual(count, 2)
  });
  it('should count the correct number of "#extra-special-span"', () => {
    let count =  pageRep.count('#extra-special-span');
    assert.strictEqual(count, 1)
  });
  it('should count the correct number of ".unused"', () => {
    let count =  pageRep.count('.unused');
    assert.strictEqual(count, 0)
  });
  it('should return the correct raw html', () => {
    let pageHtml = pageRep.getHtml();
    assert.strictEqual(
        pageHtml.replace(/\r\n/g, '\n')
            .replace(/\n/g,"")
            .replace(/\s*/g,'')
            .replace(/="{2}/g, ""),
        html.replace(/\r\n/g, '\n')
            .replace(/\n/g,"")
            .replace(/\s*/g,'')
            .replace(/="{2}/g, ""));
  });
  it('should update the amp-img tag dom structure correctly', ()=>{
    let htmlWithoutStub = pageRep.getHtml();
    assert.strictEqual(pageRep.count('img'), 0)
    pageRep.stubAmpImg();
    assert.strictEqual(pageRep.count('img'), 3)
  });

  it('should remove custom styles', () => {
    assert.strictEqual(pageRep.count('style[amp-custom=""]'),1);
    pageRep.removeCustomStyles();
    assert.strictEqual(pageRep.count('style[amp-custom=""]'),0)
  });

  it('should append custom style', () => {
    assert.strictEqual(pageRep.count('style[amp-custom=""]'),0)
    pageRep.append('head', "<style amp-custom>h1{color: blue}</style>")
    assert.strictEqual(pageRep.count('style[amp-custom=""]'),1)
  })
});