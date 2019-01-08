const assert = require('assert');
const DomParser = require('../lib/interfaces/DomParser');

describe('DOM Parser Functions', function() {
  const testFileName = 'tests/test_files/testAmpFile.html';
  const ampFileStub = {filePath: testFileName};

  describe('#buildDomFromFile()', function() {
    it('Should return a $ from a resolvable filePath', function(){
      assert.ok(DomParser.buildDomFromFile(ampFileStub.filePath));
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
      assert.ok(selectors.attributeSelectors);
      assert.ok(selectors.classSelectors);
      assert.ok(selectors.elementSelectors);
      assert.ok(selectors.emptySelectors);
      assert.ok(selectors.idSelectors);
      assert.ok(selectors.nestedSelectors);
    });

    /** Should only return true if input file has at least one of each selector type */
    it('Should return an object with non-empty sets if appropriate selectors exist', function checkForNonEmptySets() {
      const selectors = DomParser.extractDomData(ampFileStub);

      assert.ok(selectors.ampElementSelectors.size > 0);
      assert.ok(selectors.attributeSelectors.size > 0);
      assert.ok(selectors.classSelectors.size > 0);
      assert.ok(selectors.elementSelectors.size > 0);
      // assert.ok(selectors.emptySelectors.size > 0); not currently utilized
      assert.ok(selectors.idSelectors.size > 0);
      assert.ok(selectors.nestedSelectors.size > 0);
    });
  })
});