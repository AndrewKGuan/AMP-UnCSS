const assert = require('assert');
const path = require('path');
const AmpFile = require('../lib/main/amp-file');
const fs = require('fs');
const typeZeroOptimizations = require('../lib/main/type-zero-optimizations');

const inputHtml = 'tests/selectors/static/staticDom.html';


const expected = fs.readdirSync(path.join(__dirname, 'selectors/static/expected')),
    unused = fs.readdirSync(path.join(__dirname, 'selectors/static/unused'));


const tests = expected.reduce((acc, testType) => {
  acc[testType] = {
    expected: true,
    unused: false,
  };
  return acc;
}, {});

unused.forEach(unusedTestType => {
  if (tests[unusedTestType]) {
    tests[unusedTestType].unused = true;
  } else {
    tests[unusedTestType] = {
      expected: false,
      unused: true
    }
  }
});

let type0Html = false;

describe('Type 0 Optimizer Functions', function() {
  before(async () => {
    const defaultOptions = {
      optimizationLevel : 0,
      streamable: false,
      reportName: 'amp_uncss_report.json',
      reportDirectory: 'reports',
      targetDirectory: './dist',
      filenameDecorator: null,
      report: false
    };
    const ampFile = await new AmpFile(inputHtml, defaultOptions).prep();
    await typeZeroOptimizations
        .optimize(ampFile)
        .rewriteHtmlWithNewCss(defaultOptions);
    const resultingHtml = ampFile
        .optimizedHtml
        .replace(/\n/g,'')
        .replace(/\s*/g,'');

    if(resultingHtml) {
      type0Html = resultingHtml;
    }
  });


  Object.keys(tests).forEach(test => {

    if(tests[test].expected) {
      it(`Should include expected ${test} selectors in CSS`, () => {
        assert.ok(type0Html.includes(rfs(path.join(__dirname,`selectors/static/expected/${test}`))));
      });
    }

    if(tests[test].unused) {
      it(`Should not include unused ${test} selectors in CSS`, () => {

        rfs(path.join(__dirname,`selectors/static/unused/${test}`))
            .split('/*Separator*/')
            .forEach(block => {
              assert.ok(!type0Html.includes(block))
            });
      });
    }
  });
});

/** fs.readFileSync sugar */
function rfs(file) {
  return fs.readFileSync(file, 'utf-8')
      .replace(/\r\n/g, '\n')
      .replace(/\n/g,"")
      .replace(/\s*/g,'');
}