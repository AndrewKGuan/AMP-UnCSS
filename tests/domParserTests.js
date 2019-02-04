const assert = require('assert');
const DomParser = require('../lib/interfaces/DomParser');

describe('DOM Parser Functions', function() {
  const testFileName = 'tests/test_files/testAmpFile.html';
  const ampFileStub = {filePath: testFileName};

  describe('#buildDomFromFile()', function() {
    it('Should return a $ from a resolvable filePath', function(){
      assert.ok(DomParser._loadContent(ampFileStub.filePath));
    });

    it('Should gracefully handle an unresolved filePath', function(){});

  });

  describe('#extractDomData()', function() {
    it('Should return an object', function checkForObject() {
      assert.ok(DomParser.extractDomData(ampFileStub))
    });

    it('Should return a cheerio $ function', function checkForDom() {
      assert.ok(DomParser.extractDomData(ampFileStub).dom);
      assert.strictEqual(typeof DomParser.extractDomData(ampFileStub).dom, 'function')
    });

    it('Should return an object with the appropriate sets', function checkForNeededSets() {
      const selectors = DomParser.extractDomData(ampFileStub);
      assert.ok(selectors.ampElementSelectors);
      assert.ok(selectors.polyFills);
      assert.ok(selectors.escapedPseudos);
      assert.ok(selectors.pseudos);
      assert.ok(selectors.general);
      assert.ok(selectors.commaSeparatedSelectors);
      assert.ok(selectors.ampElementSelectors);
      assert.ok(selectors.joinedRawCss);
    });
  })
});