const assert = require('assert');
const AmpFile = require('../lib/main/AmpFile');
const inputHtml = 'tests/selectors/input.html';
const fs = require('fs');
const typeZeroOptimizations = require('../lib/main/typeZeroOptimizations');

/** fs.readFileSync sugar */
function rfs(file) {
  return fs.readFileSync(file, 'utf-8')
      .replace(/="{2}/g, "")
      .replace(/\r\n/g, '\n')
      .replace(/\n/g,"");
}

describe('Type 0 Optimizer Functions', function() {
  describe('#_removeUnusedAdjacentSelectors', function() {});
  describe('#_removeUnusedAmpSelectors', function() {});
  describe('#_removeUnusedAttributeSelectors', function() {});
  describe('#_removeUnusedChildSelectors', function() {});
  describe('#_removeUnusedClassSelectors', function() {});
  describe('#_removeUnusedComplexSelectors', function() {});
  describe('#_removeUnusedElementSelectors', function() {});
  describe('#_removeEmptySelectors', function() {
    const ampFile = new AmpFile(inputHtml);
    const expectedHtml = rfs('tests/selectors/empty/expected.html');

    typeZeroOptimizations.optimize(ampFile);

    assert.strictEqual(expectedHtml, ampFile.prepData().optimizedHtml);
  });
  describe('#_removeUnusedEscapedPseudoSelectors', function() {});
  describe('#_removeUnusedGeneralSiblingSelectors', function() {});
  describe('#_removeUnusedIdSelectors', function() {});
  describe('#_removeUnusedNotSelectors', function() {});
  describe('#_removeUnusedNthChildSelectors', function() {});
  describe('#_removeUnusedNthOfTypeSelectors', function() {});
  describe('#_removeUnusedPseudoSelectors', function() {});
  describe('#_removeUnusedPseudoClassWithPseudoElementSelectors', function() {});
  describe('#_removeUnusedTargetSelectors', function() {});
  describe('#_removeUnusedVendorSelectors', function() {});
});
