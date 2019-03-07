// const zero = require('./lib/main/typeZeroOptimizations');
// const DomParser = require('./lib/interfaces/DomParser.js');
// const AMP = require('./lib/main/AmpFile.js');

// const af = new AMP(testFileName);
// const postcss = require('postcss');
// zero.optimize(af)
const puppet = require('./lib/interfaces/PuppeteerInterface');
const cheerio = require('./lib/interfaces/CheerioInterface');
const fs = require('fs')
const html = fs.readFileSync('./tests/selectors/input.html', 'utf-8')
const test = new puppet(fs.readFileSync(html, 'utf-8'))
// const a = Promise.resolve(test.init()).then(async dom => {
//   const els = await dom.queryAll('span');
//   console.log(els)
// })
// console.log(a)