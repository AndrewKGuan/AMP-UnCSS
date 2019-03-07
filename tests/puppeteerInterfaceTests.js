const assert = require('assert');
const fs = require('fs');
const pupInt = require('../lib/interfaces/PuppeteerInterface');

const fileLoc = './tests/selectors/input.html';
const html = fs.readFileSync(fileLoc, 'utf-8');


let pageRep = false;

describe('PuppeteerInterface', async () => {

  before(async () => {
    pageRep = await new pupInt(html).init()
  });

  after(async () => {
    pageRep.shutdown();
  });

  it('should execute .init() the first time', async () => {
    assert.ok(pageRep.page);
  });
  it('should shortcut .init() the second time', async () => {
    const page1 = pageRep.page;
    const page2  = await pageRep.init();
    assert.ok(page1 === page2);
  });
  it('should count the correct number of "span"', async () => {
    let count = await pageRep.count('span');
    assert.strictEqual(count, 3)
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
});