const through = require('through2');
const unCss= require('./lib/main/UnCss.js');

module.exports =  function(options) {
  function gulpUnCss(vinyl, enc, cb) {
    if (vinyl.isBuffer()) {
      let {optimizedHtmlString, reporting} = unCss(vinyl,{
        streamable: true,
      }, cb);
      vinyl.contents = Buffer.from(optimizedHtmlString);
      console.log(reporting);
      console.log(
          `total size reduction: ${reporting.inputSize - reporting.outputSize} bytes`
      );
      console.log(
          `total time elapsed: ${Number((reporting.endTime - reporting.startTime) / 1000).toFixed(3)}s`);
      console.log('------------------------------')
    }

    cb(null, vinyl);
  }
  return through.obj(gulpUnCss)
};