const assert = require('assert'),
    fs = require('fs'),
    puppeteer = require('puppeteer');

const AmpFile = require('../lib/main/AmpFile'),
    CheerioInterface = require('../lib/interfaces/CheerioInterface'),
    PuppeteerInterface = require('../lib/interfaces/PuppeteerInterface');

const staticDomHtmlPath = 'tests/selectors/staticDom.html',
    dynamicDomHtmlPath = 'tests/selectors/dynamicDom.html'


describe('AmpFile.js Functions', async () => {

  let staticAf = new AmpFile(staticDomHtmlPath),
      dynamicAf = new AmpFile(dynamicDomHtmlPath),
      staticOpts = {optimizationLevel: 0},
      dynamicOpts = {optimizationLevel: 1},
      preStubStaticHtml = fs.readFileSync(staticDomHtmlPath, 'utf-8'),
      preStubDynamicHtml = fs.readFileSync(dynamicDomHtmlPath, 'utf-8'),
      browser;

  before(async() => {
      browser = await puppeteer.launch({headless: true})
  });

  it('should construct with correct data', () =>{
    assert.strictEqual(staticAf.filePath, staticDomHtmlPath);
    assert.strictEqual(staticAf.fileName, 'staticDom.html');
    assert.strictEqual(staticAf.fileExt, 'html');
    assert.strictEqual(staticAf.fileDir, 'tests/selectors');
    assert.strictEqual(staticAf._stats.fileName, 'staticDom.html');
    assert.strictEqual(staticAf._stats.status, 'running');
    assert.strictEqual(staticAf._stats.inputSize, 0);
    assert.strictEqual(staticAf._stats.outputSize, 0);
    assert.ok(staticAf._stats.startTime > 0);
    assert.strictEqual(staticAf._stats.endTime, 0);
    assert.strictEqual(Object.keys(staticAf._stats.selectorsRemoved).length, 0);


    assert.strictEqual(dynamicAf.filePath, dynamicDomHtmlPath)
    assert.strictEqual(dynamicAf.fileName, 'dynamicDom.html');
    assert.strictEqual(dynamicAf.fileExt, 'html');
    assert.strictEqual(dynamicAf.fileDir, 'tests/selectors')
    assert.strictEqual(dynamicAf._stats.fileName, 'dynamicDom.html');
    assert.strictEqual(dynamicAf._stats.status, 'running');
    assert.strictEqual(dynamicAf._stats.inputSize, 0);
    assert.strictEqual(dynamicAf._stats.outputSize, 0);
    assert.ok(dynamicAf._stats.startTime > 0);
    assert.strictEqual(dynamicAf._stats.endTime, 0);
    assert.strictEqual(Object.keys(dynamicAf._stats.selectorsRemoved).length, 0);
  });

  await describe('#prep', async () => {
    await describe('Static DOM:', async () => {
      it('should insert img els into amp-img elements', async ()=> {
        assert.ok(!preStubStaticHtml.includes('<img'));
        await staticAf.prep(staticOpts, browser);
        let postStubHtml = staticAf.staticDom.getHtml();
        assert.ok(postStubHtml.includes('<img'));
      });

      it('it should have only a .staticDom', () => {
        assert.strictEqual(staticAf.dynamicDom, undefined);
      });
    });

    await describe('Dynamic DOM:',async () =>{
      before(async() => {
        await dynamicAf.prep(dynamicOpts, browser);
      });

      it('should have both .staticDom and .dynamicDom', () =>{
        assert.ok(Object.getPrototypeOf(dynamicAf.staticDom));
        assert.ok(Object.getPrototypeOf(dynamicAf.dynamicDom));
      });
    })
  });

  await describe('#hasExceptionTags', async () => {
    describe('Static DOM:', () => {
      it('should return false for a page without dynamic amp tags', () => {
        assert.strictEqual(staticAf.hasExceptionTags(), false)
      });
    });

    describe('Dynamic DOM:', () =>{
      it('should return true for page with dynamic amp tags', () =>{
        assert.strictEqual(dynamicAf.hasExceptionTags(), true)
      });
    })
  });

  await describe('#rewriteWithNewCss', async ()=> {
    before(async ()=> {
      await staticAf.rewriteWithNewCss(staticOpts);
      await dynamicAf.rewriteWithNewCss(dynamicOpts);
    });

    describe('Static DOM:', () =>{
      it('should update AmpFile._stats.status', ()=>{
        assert.ok(staticAf._stats.endTime > staticAf._stats.startTime);
        assert.strictEqual(staticAf._stats.status, 'complete');
      });
      it('should update old html with optimized html', () => {
        assert.ok(staticAf.optimizedHtml.length > 0);
        assert.ok(preStubStaticHtml !== staticAf.optimizedHtml)
      });
    });
    describe('Dynamic DOM:', () =>{
      it('should update AmpFile._stats.status', ()=>{
        assert.ok(dynamicAf._stats.endTime > dynamicAf._stats.startTime);
        assert.strictEqual(dynamicAf._stats.status, 'complete');
      });
      it('should update old html with optimized html', () => {
        assert.ok(dynamicAf.optimizedHtml.length > 0);
        assert.ok(preStubDynamicHtml !== dynamicAf.optimizedHtml)
      });
    });
  });

  describe('#saveHtmlToDisc', () => {
    before((done) => {
      staticAf.saveHtmlToDisc('./test_results', '_output');
      dynamicAf.saveHtmlToDisc('./test_results', '_output');
      done()
    });

    describe('Static DOM:', () =>{
      it('should write a string to the correct file location', ()=> {
        assert.ok(fs.existsSync('./test_results'));
        assert.ok(fs.existsSync('./test_results/staticDom_output.html'))
      });
      it('should write the correct string', () =>{
        assert.strictEqual(
            staticAf.optimizedHtml,
            fs.readFileSync(
                './test_results/staticDom_output.html', 'utf-8'))
      })
    });

    describe('Dynamic DOM:', () =>{
      it('should write a string to the correct file location', ()=> {
        assert.ok(fs.existsSync('./test_results'));
        assert.ok(fs.existsSync('./test_results/dynamicDom_output.html'))
      });
      it('should write the correct string', () =>{
        assert.strictEqual(
            dynamicAf.optimizedHtml,
            fs.readFileSync(
                './test_results/dynamicDom_output.html', 'utf-8'))
      })
    });
  });

  after(async() => {
    await browser.close();

    // Delete UnCss artifacts after test block
    if(fs.existsSync('test_results')) deleteRecursive('output');
  })
});

function deleteRecursive(path) {
  if(fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      let currPath = path + '/' + file;
      if(fs.lstatSync(currPath).isDirectory()) {
        deleteRecursive(currPath);
      } else {
        fs.unlinkSync(currPath)
      }
    });
    fs.rmdirSync(path);
  }
}
