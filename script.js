// const zero = require('./lib/main/typeZeroOptimizations');
// const DomParser = require('./lib/interfaces/dom-parser.js');
// const AMP = require('./lib/main/amp-file.js');

// const af = new AMP(testFileName);
// const postcss = require('postcss');
// zero.optimize(af)
// const p=require('puppeteer')
// const puppet = require('./interfaces/puppeteer-interface');
// const cheerio = require('./interfaces/cheerio-interface');
// const fs = require('fs'),
//     path = require('path')
// const staticPath = './tests/selectors/static/staticDom.html',
//     dynamicPath = './tests/selectors/dynamic/dynamicDom.html';
// const staticHtml = fs.readFileSync(staticPath, 'utf-8')
// const dynamicHtml = fs.readFileSync(dynamicPath, 'utf-8')
// let browser, staticPage, dynamicPage;
// p.launch({devtools: true, sloMo: 500})
//     .then(async b => {
//       let goToPage= await b.newPage();
//       await goToPage.goto(path.join('file://',path.resolve('.'), dynamicPath));
//       let setPage = await b.newPage();
//       await setPage.setContent(dynamicHtml);
//     });
// // const test = new puppet(fs.readFileSync(html, 'utf-8'))
// // const a = Promise.resolve(test.init()).then(async dom => {
// //   const els = await dom.queryAll('span');
// //   console.log(els)
// // })
// // console.log(  a)

let stubs = require('./lib/utils/stubs');
let cheerio = require('cheerio');

let test5 = cheerio.load('<amp-carousel id="custom-button" width="400" height="300" layout="responsive" type="slides" autoplay delay="2000"><amp-img src="/static/samples/img/image1.jpg" width="400" height="300" layout="responsive" alt="a sample image"></amp-img><amp-img src="/static/samples/img/image2.jpg" width="400" height="300" layout="responsive" alt="another sample image"></amp-img><amp-img src="/static/samples/img/image3.jpg" width="400" height="300" layout="responsive" alt="and another sample image"></amp-img></amp-carousel>');

let caro = test5('amp-carousel');

stubs['amp-carousel'](caro);
console.log(test5.html())