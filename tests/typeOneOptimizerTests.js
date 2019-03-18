const assert = require('assert');
const path = require('path'),
    puppeteer = require('puppeteer');
const AmpFile = require('../lib/main/AmpFile');
const fs = require('fs');
const typeOneOptimizations = require('../lib/main/typeOneOptimizations');

const inputHtml = 'tests/selectors/dynamic/dynamicDom.html';
// const inputHtml = '/usr/local/google/home/schuettlerk/IdeaProjects/AMP-UnCSS/tests/selectors/dynamic/dynamicDom.html'

const expected = fs.readdirSync(path.join(__dirname, 'selectors/dynamic/expected')),
    unused = fs.readdirSync(path.join(__dirname, 'selectors/dynamic/unused'));


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

let type1Html = false;
let browser;

describe('Type 1 Optimizer Functions', function() {
  this.timeout(0)
  before(async () => {
    browser = await puppeteer.launch();
    const defaultOptions = {
      optimizationLevel : 1,
      streamable: false,
      reportName: 'amp_uncss_report.json',
      reportDirectory: 'reports',
      targetDirectory: './dist',
      filenameDecorator: null,
      report: false
    };
    const ampFile = await new AmpFile(inputHtml, defaultOptions , browser).prep();
    await typeOneOptimizations
        .optimize(ampFile)
        .then(ampFile => {
          return ampFile.rewriteHtmlWithNewCss(defaultOptions)
        });

    const resultingHtml = ampFile
        .optimizedHtml
        .replace(/\n/g,'')
        .replace(/\s*/g,'');

    if(resultingHtml) {
      type1Html = resultingHtml;
      fs.writeFileSync('./html.html', type1Html)
    }
  });


  Object.keys(tests).forEach(test => {

    if(tests[test].expected) {
      it(`Should include expected ${test} selectors in CSS`, () => {
        assert.ok(
            type1Html.includes(
                rfs(path.join(__dirname,`selectors/dynamic/expected/${test}`))
            ));
      });
    }

    if(tests[test].unused) {
      it(`Should not include unused ${test} selectors in CSS`, () => {

        rfs(path.join(__dirname,`selectors/dynamic/unused/${test}`))
            .split('/*Separator*/')
            .forEach(block => {
              assert.strictEqual(type1Html.indexOf(block), -1)
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