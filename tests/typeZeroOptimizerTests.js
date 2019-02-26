const assert = require('assert');
const path = require('path');
const AmpFile = require('../lib/main/AmpFile');
const fs = require('fs');
const typeZeroOptimizations = require('../lib/main/typeZeroOptimizations');

const inputHtml = 'tests/selectors/input.html';


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

describe('Type 0 Optimizer Functions', function() {
  before(done => {
    const ampFile = new AmpFile(inputHtml);
    const resultingHtml = typeZeroOptimizations
        .optimize(ampFile)
        .prepData()
        .optimizedHtml
        .replace(/\n/g,'')
        .replace(/\s*/g,'');

    if(resultingHtml) {
      type0Html = resultingHtml;
    }
    done()
  });


  Object.keys(tests).forEach(test => {

    if(tests[test].expected) {
      it(`Should include expected ${test} selectors in CSS`, () => {
        assert.ok(type0Html.includes(rfs(path.join(__dirname,`selectors/expected/${test}`))));
      });
    }

    if(tests[test].unused) {
      it(`Should not include unused ${test} selectors in CSS`, () => {
        assert.ok(!type0Html.includes(rfs(path.join(__dirname,`selectors/unused/${test}`))));
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