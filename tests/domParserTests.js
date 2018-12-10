const assert = require('assert');
const DomParser = require('../lib/interfaces/DomParser');

describe('DOM Parser Functions', function() {
  const testFileName = 'tests/test_files/testAmpFile.html';

  describe('#buildDomFromFile()', function() {
    it('Should return a $ from a resolvable file', function(){
      assert.ok(DomParser.buildDomFromFile(testFileName));
    });

    it('Should gracefully handle an unresolved file', function(){});

  });

  describe('#extractDomData()', function() {
    it('Should return an object', function checkForObject() {
      assert.ok(DomParser.extractDomData(testFileName))
    });

    it('Should return a cheerio $ function', function checkForDom() {
      assert.ok(DomParser.extractDomData(testFileName).dom);
      assert.strictEqual(typeof DomParser.extractDomData(testFileName).dom, 'function')
    });

    it('Should return an object with the appropriate sets', function checkForNeededSets() {
      const selectors = DomParser.extractDomData(testFileName)
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
      const selectors = DomParser.extractDomData(testFileName);

      assert.ok(selectors.ampElementSelectors.size > 0);
      assert.ok(selectors.attributeSelectors.size > 0);
      assert.ok(selectors.classSelectors.size > 0);
      assert.ok(selectors.elementSelectors.size > 0);
      assert.ok(selectors.emptySelectors.size > 0);
      assert.ok(selectors.idSelectors.size > 0);
      assert.ok(selectors.nestedSelectors.size > 0);
    });
  })
});