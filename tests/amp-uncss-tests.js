const assert = require('assert');
const fs = require('fs');
const path = require('path')

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
      reportSize: 'small',
      reportDirectory: './output',
      targetDirectory: './output',
      filenameDecorator: null,
      report: true,
      batchSize: 10,
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

  describe('#run', async function() {
    this.timeout(10000);
    before(async function() {
      ampFiles = await uncss.run();
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
        if (af.filePath === badDomHtmlPath) {
          // Exception for malformed.html;
          assert.strictEqual(hasStatic, false);
        } else {
          assert.strictEqual(hasStatic, true);
        }
      });
    });
    it('appropriate ampFiles should have a dynamic Dom', function() {
      ampFiles.forEach(af => {
        if (af.filePath === dynamicDomHtmlPath) {
          assert.ok(Boolean(af.dynamicDom))
        }
      })
    });
    it('should initialize an empty report', function() {
      assert.ok(fs.existsSync('./output/amp_uncss_report.json'));
    });

    it('should update optimized status of each ampFile', function() {
      ampFiles.forEach((af, index) => {
        const isOptimized =
            !!(af._stats.status.optimized && af._stats.status.optimized > 0);
        const didFail = af.hasFailed();
        if (af.filePath === badDomHtmlPath) {
          // Exception for malformed.html;
          assert.strictEqual(didFail, true);
        } else if (af.filePath){
          assert.strictEqual(isOptimized, true);
          assert.strictEqual(didFail, false);
        }
      });
    });

    it('should optimize each ampFile with the correct optimization',
        function() {
          ampFiles.forEach(af => {
            if (af.filePath === dynamicDomHtmlPath) {
              assert.strictEqual(af._stats.status.optLevel, 1);
            } else if (af.filePath === staticDomHtmlPath) {
              assert.strictEqual(af._stats.status.optLevel, 0);
            }
          })
        }
    );

    it('should produce new html for each ampFile', function() {
      ampFiles.forEach((af, index) => {
        if (af.filePath === badDomHtmlPath) {
          assert.ok(!af.optimizedHtml);
        } else {
          assert.ok(!!af.optimizedHtml);
        }
      });
    });

    it('should append new stats to ampFile._stats', function() {
      ampFiles.forEach((af, index) => {
        if (af.filePath === badDomHtmlPath) {
          assert.ok(af._stats.status.failed);
          assert.ok(af._stats.status['failure-msg']);
        } else {
          assert.ok(af._stats.status.complete > 0);
          assert.ok(af._stats.inputSize);
        }
      });
    });
    it('should save files to disc', function() {
      assert.strictEqual(walkDir('./output').length,
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

function walkDir(dir) {
  const result = [];

  const files = [dir];
  do {
    const filepath = files.pop();
    const stat = fs.lstatSync(filepath);
    if (stat.isDirectory()) {
      fs
          .readdirSync(filepath)
          .forEach(f => files.push(path.join(filepath, f)));
    } else if (stat.isFile()) {
      result.push(path.relative(dir, filepath));
    }
  } while (files.length !== 0);

  return result;
}