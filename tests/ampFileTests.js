const assert = require('assert');
const AmpFile = require('../lib/main/AmpFile');
const testFilePath = 'tests/test_files/testAmpFile.html'


describe('AMP File Functions', function() {
  const ampFile = new AmpFile('test');

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

  describe("#getStats()", function() {
    it('Should return minimum stats on unoptimized file', function() {
      const testFile = new AmpFile(testFilePath);
      const testStats = testFile.getStats();

      assert.ok(testStats.startTime);

      delete testStats.startTime;

      assert.deepStrictEqual(testFile.getStats(), {
        fileName: testFilePath,
        status: 'running',
        inputSize: 97877,
        outputSize: 0,
        endTime: 0,
        selectorsRemoved: 0
      })
    })
  })
});
