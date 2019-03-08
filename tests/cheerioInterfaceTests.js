const assert = require('assert');
const fs = require('fs');
const cheerioInt = require('../lib/interfaces/CheerioInterface');

const fileLoc = './tests/selectors/input.html';
const html = fs.readFileSync(fileLoc, 'utf-8');

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
  it('should update the amp-img tag dom structure correctly', ()=>{});
});