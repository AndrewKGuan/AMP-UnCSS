const assert = require('assert');
const DomParser = require('../lib/interfaces/DomParser');

describe('DOM Parser Functions', function() {

  describe('#buildDomFromFile()', function() {
    const testFileName = 'tests/test_files/testAmpFile.html'
    it('Should return a dom from a resolvable file', function(){
      assert.ok(DomParser.buildDomFromFile(testFileName));
    });

    it('Should gracefully handle an unresolved file', function(){});
  });
});