const assert = require('assert');
const path = require('path'),
    puppeteer = require('puppeteer');
const AmpFile = require('../lib/main/AmpFile');
const fs = require('fs');
const typeOneOptimizations = require('../lib/main/typeOneOptimizations');

const inputHtml = 'tests/selectors/dynamicDom.html';


const expected = fs.readdirSync(path.join(__dirname, 'selectors/expected')),
    unused = fs.readdirSync(path.join(__dirname, 'selectors/unused'));


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
let browser;

describe('Type 1 Optimizer Functions', function() {
  before(async () => {
    browser = await puppeteer.launch({headless:true});
    const defaultOptions = {
      optimizationLevel : 1,
      streamable: false,
      reportName: 'amp_uncss_report.json',
      reportDirectory: 'reports',
      targetDirectory: './dist',
      filenameDecorator: null,
      report: false
    };
    const ampFile = await new AmpFile(inputHtml).prep(defaultOptions, browser);
    await typeOneOptimizations
        .optimize(ampFile)
        .then(ampFile => {
          return ampFile.rewriteWithNewCss(defaultOptions)
        });

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
        assert.ok(type0Html.includes(rfs(path.join(__dirname,`selectors/expected/${test}`))));
      });
    }

    if(tests[test].unused) {
      it(`Should not include unused ${test} selectors in CSS`, () => {

        rfs(path.join(__dirname,`selectors/unused/${test}`))
            .split('/*Separator*/')
            .forEach(block => {
              assert.ok(!type0Html.includes(block))
            });
      });
    }
  });
  after(async () => {
    browser.close()
  })
});

/** fs.readFileSync sugar */
function rfs(file) {
  return fs.readFileSync(file, 'utf-8')
      .replace(/\r\n/g, '\n')
      .replace(/\n/g,"")
      .replace(/\s*/g,'');
}