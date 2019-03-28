const assert = require('assert');
const fs = require('fs');

const UnCss = require('../lib/main/amp-uncss.js');


const testOpts = {
  optimizationLevel: 1,
  report: true,
  targetDirectory: './output',
  reportDirectory: './output',
};
const staticDomHtmlPath = 'tests/selectors/static/staticDom.html';
const dynamicDomHtmlPath = 'tests/selectors/dynamic/dynamicDom.html';
const badDomHtmlPath = 'tests/html/invalid/malformed.html';

const filePaths = [staticDomHtmlPath, dynamicDomHtmlPath, badDomHtmlPath];


describe('unCss functions', async function() {
  this.timeout(10000);
  let uncss;
  let ampFiles;

  before(function() {
    uncss = new UnCss(filePaths, testOpts);
  });

  it('should construct properly', function() {
    assert.deepStrictEqual(uncss.options, {
      optimizationLevel: 1,
      streamable: false,
      reportName: 'amp_uncss_report.json',
      reportDirectory: './output',
      targetDirectory: './output',
      filenameDecorator: null,
      report: true,
    });
  });

  await it(
      `should ${
        testOpts.optimizationLevel ? '' : 'not'
      } init with a Puppeteer browser`,
      async function() {
        await uncss.init();
        assert.ok(uncss.browser);
      });

  describe('#_setup', async function() {
    this.timeout(10000);
    before(async function() {
      ampFiles = await uncss._setup();
    });

    it('should return a list of ampFiles to be tested', function() {
      assert.strictEqual(ampFiles.length, filePaths.length);
      assert.ok(
          ampFiles.every((af) => af.constructor.name === 'AmpFile')
      );
    });
    it('ampFiles for valid HTML should have a static dom property', function() {
      ampFiles.forEach((af, index) => {
        const hasStatic = Boolean(af.staticDom);
        if (index === 2) {
          // Exception for malformed.html;
          assert.strictEqual(hasStatic, false);
        } else {
          assert.strictEqual(hasStatic, true);
        }
      });
    });
    it('appropriate ampFiles should have a dynamic Dom', function() {
      assert.ok(ampFiles[1].dynamicDom);
    });
    it('should initialize an empty report', function() {
      assert.ok(fs.existsSync('./output/amp_uncss_report.json'));
    });
  });

  describe('#_optimize', async function() {
    this.timeout(10000);
    before(async function() {
      ampFiles = await uncss._optimize(ampFiles);
    });

    it('should return a full list of ampFiles', function() {
      assert.strictEqual(ampFiles.length, filePaths.length);
      assert.ok(ampFiles.every((af) => af.constructor.name === 'AmpFile'));
    });

    it('should update optimized status of each ampFile', function() {
      ampFiles.forEach((af, index) => {
        const isOptimized =
            !!(af._stats.status.optimized && af._stats.status.optimized > 0);
        const didFail = af.hasFailed();
        if (index === 2) {
          // Exception for malformed.html;
          assert.strictEqual(didFail, true);
        } else {
          assert.strictEqual(isOptimized, true);
          assert.strictEqual(didFail, false);
        }
      });
    });

    it('should optimize each ampFile appropriately', function() {
      ampFiles.forEach((af, index) => {
        if (index === 2) {
          assert.strictEqual(
              Object.keys(af._stats.selectorsRemoved).length, 0
          );
        } else {
          assert.ok(Object.keys(af._stats.selectorsRemoved).length > 0);
        }
      });
    });

    it('should optimize each ampFile with the correct optimization',
        function() {
          assert.strictEqual(ampFiles[0]._stats.status.optLevel, 0);
          assert.strictEqual(ampFiles[1]._stats.status.optLevel, 1);
        });
  });

  describe('#_tearDown', async function() {
    this.timeout(10000);
    before(async function() {
      ampFiles = await uncss._tearDown(ampFiles);
    });

    it('should return a full list of ampFiles', function() {
      assert.strictEqual(ampFiles.length, filePaths.length);
      assert.ok(ampFiles.every((af) => af.constructor.name === 'AmpFile'));
    });
    it('should produce new html for each ampFile', function() {
      ampFiles.forEach((af, index) => {
        if (index === 2) {
          assert.ok(!af.optimizedHtml);
        } else {
          assert.ok(!!af.optimizedHtml);
        }
      });
    });

    it('should append new stats to ampFile._stats', function() {
      ampFiles.forEach((af, index) => {
        if (index === 2) {
          assert.ok(af._stats.status.failed);
          assert.ok(af._stats.status['failure-msg']);
        } else {
          assert.ok(af._stats.status.complete > 0);
          assert.ok(af._stats.inputSize);
        }
      });
    });
    it('should save files to disc', function() {
      assert.strictEqual(fs.readdirSync('./output').length,
          filePaths.length + 1);
    });
    it('should update the report file appropriately', function() {
      const report = JSON.parse(
          fs.readFileSync('./output/amp_uncss_report.json', 'utf-8')
      );
      assert.strictEqual(report.tests[0].files.length, filePaths.length);
    });
  });

  after(async () => {
    uncss.end();
  });
});
