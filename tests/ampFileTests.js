const assert = require('assert');
const AmpFile = require('../lib/main/AmpFile');
const testFilePath = 'tests/test_files/testAmpFile.html'


describe('AMP File Functions', function() {
  const ampFile = new AmpFile('test');

  describe('#hasExceptionTags()', function() {
    const ampFileWithException = {'exceptionElementTags': new Set(['amp-bind'])};
    const ampFileWithoutException = {'exceptionElementTags': new Set([])};

    it(
        'An AmpFile without an exception return false',
        function() {
          assert.strictEqual(
              ampFile.hasExceptionTags.apply(ampFileWithoutException), false);
        });

    it(
        'An AmpFile with an exception and without an exception set return true',
        function() {
          assert.strictEqual(
              ampFile.hasExceptionTags.apply(ampFileWithException), true);
        });

  });

  describe("#_stats()", function() {
    it('Should return minimum _stats on unoptimized file', function() {
      const testFile = new AmpFile(testFilePath);
      const testStats = testFile._stats();

      assert.ok(testStats.startTime);

      delete testStats.startTime;

      assert.deepStrictEqual(testFile._stats(), {
        fileName: testFilePath.split('/').pop(),
        status: 'running',
        inputSize: 97877,
        outputSize: 0,
        endTime: 0,
        selectorsRemoved: 0
      })
    })
  })
});
