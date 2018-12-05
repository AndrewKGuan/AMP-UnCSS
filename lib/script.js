const zero = require('./lib/main/typeZeroOptimizations');
const DomParser = require('./lib/interfaces/DomParser.js');
const AMP = require('./lib/main/AmpFile.js');
const testFileName = 'tests/test_files/basic.html';
const af = new AMP(testFileName);
const postcss = require('postcss');
zero.optimize(af)
