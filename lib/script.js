// const zero = require('./lib/main/typeZeroOptimizations');
// const DomParser = require('./lib/interfaces/DomParser.js');
// const AMP = require('./lib/main/AmpFile.js');

// const af = new AMP(testFileName);
// const postcss = require('postcss');
// zero.optimize(af)
const p=require('puppeteer')
const puppet = require('../lib/interfaces/PuppeteerInterface');
const cheerio = require('../lib/interfaces/CheerioInterface');
const fs = require('fs'),
    path = require('path')
const staticPath = './tests/selectors/static/staticDom.html',
    dynamicPath = './tests/selectors/dynamic/dynamicDom.html';
const staticHtml = fs.readFileSync(staticPath, 'utf-8')
const dynamicHtml = fs.readFileSync(dynamicPath, 'utf-8')
let browser, staticPage, dynamicPage;
p.launch({devtools: true, sloMo: 500})
    .then(async b => {
      let goToPage= await b.newPage();
      await goToPage.goto(path.join('file://',path.resolve('.'), dynamicPath));
      let setPage = await b.newPage();
      await setPage.setContent(dynamicHtml);
    });
// const test = new puppet(fs.readFileSync(html, 'utf-8'))
// const a = Promise.resolve(test.init()).then(async dom => {
//   const els = await dom.queryAll('span');
//   console.log(els)
// })
// console.log(  a)