const assert = require('assert');
const fs = require('fs');
const puppeteer = require('puppeteer');

const AmpFile = require('../lib/main/amp-file');
defaultConfig = require('../lib/utils/default-options');

const staticDomHtmlPath = 'tests/selectors/static/staticDom.html';
const dynamicDomHtmlPath = 'tests/selectors/dynamic/dynamicDom.html';


describe('AmpFile.js Functions', async function() {
  this.timeout(10000);
  let staticAf;
  let dynamicAf;
  const staticOpts = Object.assign({}, defaultConfig, {optimizationLevel: 0});
  const dynamicOpts = Object.assign({}, defaultConfig, {optimizationLevel: 1});
  const preStubStaticHtml = fs.readFileSync(staticDomHtmlPath, 'utf-8');
  const preStubDynamicHtml = fs.readFileSync(dynamicDomHtmlPath, 'utf-8');
  let browser;

  before(async () => {
    browser = await puppeteer.launch({headless: true});
    staticAf = new AmpFile(staticDomHtmlPath, staticOpts, browser);
    dynamicAf = new AmpFile(dynamicDomHtmlPath, dynamicOpts, browser);
  });

  it('should construct with correct data', () =>{
    assert.strictEqual(staticAf.filePath, staticDomHtmlPath);
    assert.strictEqual(staticAf.fileName, 'staticDom.html');
    assert.strictEqual(staticAf.fileExt, 'html');
    assert.strictEqual(staticAf.fileDir, 'tests/selectors/static');
    assert.strictEqual(staticAf._stats.fileName, 'staticDom.html');
    assert.ok(staticAf._stats.status.instantiated > 0);
    assert.strictEqual(staticAf._stats.inputSize, 0);
    assert.strictEqual(staticAf._stats.outputSize, 0);
    assert.strictEqual(Object.keys(staticAf._stats.selectorsRemoved).length, 0);


    assert.strictEqual(dynamicAf.filePath, dynamicDomHtmlPath);
    assert.strictEqual(dynamicAf.fileName, 'dynamicDom.html');
    assert.strictEqual(dynamicAf.fileExt, 'html');
    assert.strictEqual(dynamicAf.fileDir, 'tests/selectors/dynamic');
    assert.strictEqual(dynamicAf._stats.fileName, 'dynamicDom.html');
    assert.ok(dynamicAf._stats.status.instantiated > 0);
    assert.strictEqual(dynamicAf._stats.inputSize, 0);
    assert.strictEqual(dynamicAf._stats.outputSize, 0);
    assert.strictEqual(
        Object.keys(dynamicAf._stats.selectorsRemoved).length,
        0);
  });

  await describe('#prep', async () => {
    await describe('Static DOM:', async () => {
      it('should insert img els into amp-img elements', async ()=> {
        assert.ok(!preStubStaticHtml.includes('<img'));
        await staticAf.prep();
        const postStubHtml = staticAf.staticDom.getHtml();
        assert.ok(postStubHtml.includes('<img'));
      });

      it('it should have only a .staticDom', () => {
        assert.strictEqual(staticAf.dynamicDom, undefined);
      });
    });

    await describe('Dynamic DOM:', async () =>{
      before(async () => {
        await dynamicAf.prep();
      });

      it('should have both .staticDom and .dynamicDom', () =>{
        assert.ok(Object.getPrototypeOf(dynamicAf.staticDom));
        assert.ok(Object.getPrototypeOf(dynamicAf.dynamicDom));
      });
    });
  });

  await describe('#hasExceptionTags', async () => {
    describe('Static DOM:', () => {
      it('should return false for a page without dynamic amp tags', () => {
        assert.strictEqual(staticAf.hasExceptionTags(), false);
      });
    });

    describe('Dynamic DOM:', () =>{
      it('should return true for page with dynamic amp tags', () =>{
        assert.strictEqual(dynamicAf.hasExceptionTags(), true);
      });
    });
  });

  await describe('#rewriteHtmlWithNewCss', async ()=> {
    before(async ()=> {
      await staticAf.rewriteHtmlWithNewCss();
      await dynamicAf.rewriteHtmlWithNewCss();
    });

    describe('Static DOM:', () =>{
      it('should update AmpFile._stats.status', ()=>{
        assert.ok(
            staticAf._stats.status.complete >
            staticAf._stats.status.instantiated
        );
      });
      it('should update old html with optimized html', () => {
        assert.ok(staticAf.optimizedHtml.length > 0);
        assert.ok(preStubStaticHtml !== staticAf.optimizedHtml);
      });
    });
    describe('Dynamic DOM:', () =>{
      it('should update AmpFile._stats.status', ()=>{
        assert.ok(
            dynamicAf._stats.status.complete >
            dynamicAf._stats.status.instantiated
        );
      });
      it('should update old html with optimized html', () => {
        assert.ok(dynamicAf.optimizedHtml.length > 0);
        assert.ok(preStubDynamicHtml !== dynamicAf.optimizedHtml);
      });
    });
  });

  describe('#saveHtmlToDisc', () => {
    before((done) => {
      staticAf.saveHtmlToDisc('./test_results', '_output');
      dynamicAf.saveHtmlToDisc('./test_results', '_output');
      done();
    });

    describe('Static DOM:', () =>{
      it('should write a string to the correct file location', ()=> {
        assert.ok(fs.existsSync('./test_results'));
        assert.ok(fs.existsSync('./test_results/staticDom_output.html'));
      });
      it('should write the correct string', () =>{
        assert.strictEqual(
            staticAf.optimizedHtml,
            fs.readFileSync(
                './test_results/staticDom_output.html', 'utf-8'));
      });
    });

    describe('Dynamic DOM:', () =>{
      it('should write a string to the correct file location', ()=> {
        assert.ok(fs.existsSync('./test_results'));
        assert.ok(fs.existsSync('./test_results/dynamicDom_output.html'));
      });
      it('should write the correct string', () =>{
        assert.strictEqual(
            dynamicAf.optimizedHtml,
            String(fs.readFileSync(
                './test_results/dynamicDom_output.html', 'utf-8')));
      });
    });
  });

  after(async () => {
    await browser.close();

    // Delete UnCss artifacts after test block
    if (fs.existsSync('./test_results')) deleteRecursive('./test_results');
  });
});

/**
 * @param {string} path
 */
function deleteRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const currPath = path + '/' + file;
      if (fs.lstatSync(currPath).isDirectory()) {
        deleteRecursive(currPath);
      } else {
        fs.unlinkSync(currPath);
      }
    });
    fs.rmdirSync(path);
  }
}
