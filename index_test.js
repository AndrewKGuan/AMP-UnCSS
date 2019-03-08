const through = require('through2');
const unCss= require('./lib/main/UnCss.js');

module.exports =  function(options) {
  function gulpUnCss(vinyl, enc, cb) {
    if (vinyl.isBuffer()) {
      const processOpts = Object.assign(
          options,{
            streamable: true,
            report: !!options.report || !!options.reportDirectory || !!options.reportName
      });
      unCss(processOpts).run(vinyl)
          .then(results => {
            let {optimizedHtmlString, reporting} = results;
            vinyl.contents = Buffer.from(optimizedHtmlString);
            cb(null, vinyl);
          })
    } else {
      cb(null, vinyl);
    }

  }
  return through.obj(gulpUnCss)
};