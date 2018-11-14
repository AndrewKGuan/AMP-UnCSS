const assert = require('assert');
const DomParser = require('../lib/interfaces/DomParser');

describe('DOM Parser Functions', function() {
  const testFileName = 'tests/test_files/testAmpFile.html'

  describe('#buildDomFromFile()', function() {
    it('Should return a dom from a resolvable file', function(){
      assert.ok(DomParser.buildDomFromFile(testFileName));
    });

    it('Should gracefully handle an unresolved file', function(){});

  });

  describe('#extractDomData()', function() {
    it('Should return an object', function checkForObject() {
      assert.ok(DomParser.extractDomData(testFileName))
    });

    it('Should return a cheerio dom function', function checkForDom() {
      assert.ok(DomParser.extractDomData(testFileName).dom);
      assert.strictEqual(typeof DomParser.extractDomData(testFileName).dom, 'function')
    });

    it('Should return an object with the appropriate sets', function checkForNeededSets() {
      assert.ok(DomParser.extractDomData(testFileName).ampElementSelectors);
      assert.ok(DomParser.extractDomData(testFileName).attributeSelectors);
      assert.ok(DomParser.extractDomData(testFileName).classSelectors);
      assert.ok(DomParser.extractDomData(testFileName).elementSelectors);
      assert.ok(DomParser.extractDomData(testFileName).emptySelectors);
      assert.ok(DomParser.extractDomData(testFileName).idSelectors);
      assert.ok(DomParser.extractDomData(testFileName).nestedSelectors);
    });

    /** Should only return true if input file has at least one of each selector type */
    it('Should return an object with non-empty sets if appropriate selectors exist', function checkForNonEmptySets() {
      assert.ok(DomParser.extractDomData(testFileName).ampElementSelectors.size > 0);
      assert.ok(DomParser.extractDomData(testFileName).attributeSelectors.size > 0);
      assert.ok(DomParser.extractDomData(testFileName).classSelectors.size > 0);
      assert.ok(DomParser.extractDomData(testFileName).elementSelectors.size > 0);
      assert.ok(DomParser.extractDomData(testFileName).emptySelectors.size > 0);
      assert.ok(DomParser.extractDomData(testFileName).idSelectors.size > 0);
      assert.ok(DomParser.extractDomData(testFileName).nestedSelectors.size > 0);
    });
  })
});