const assert = require('assert');
const AmpFile = require('../lib/main/AmpFile');

describe('AMP File Functions', function() {

  describe('#hasExceptionTags()', function() {
    const ampFileWithoutExceptionWithoutExceptionSet = {'elements': new Set()};
    const ampFileWithoutExceptionWithExceptionSetTrue = {
      '_hasExceptionTags': true,
      'elements': new Set()};
    const ampFileWithoutExceptionWithExceptionSetFalse = {
      '_hasExceptionTags': false,
      'elements': new Set()};
    const ampFileWithExceptionWithoutExceptionSet = {
      'elements': new Set(['amp-list'])};
    const ampFileWithExceptionWithExceptionSet = {
      _hasExceptionTags: true,
      'elements': new Set(['amp-bind'])};

    const ampFile = new AmpFile('test');

    it(
        'An AmpFile without an exception and no exception set should return false',
        function() {
          assert.strictEqual(ampFile.hasExceptionTags.apply(ampFileWithoutExceptionWithoutExceptionSet), false);
        });

    it(
        'An AmpFile without an exception and with exception set "true" should return true',
        function() {
          assert.strictEqual(ampFile.hasExceptionTags.apply(ampFileWithoutExceptionWithExceptionSetTrue), true);
        });

    it(
        'An AmpFile without an exception and with exception set "false" should return false',
        function() {
          assert.strictEqual(ampFile.hasExceptionTags.apply(ampFileWithoutExceptionWithExceptionSetFalse), false);
        });

    it(
        'An AmpFile with an exception and without an exception set return true',
        function() {
          assert.strictEqual(ampFile.hasExceptionTags.apply(ampFileWithExceptionWithoutExceptionSet), true);
        });

    it(
        'An AmpFile with an exception and with exception set "true" should return true',
        function() {
          assert.strictEqual(ampFile.hasExceptionTags.apply(ampFileWithExceptionWithExceptionSet), true);
        });
  });
});