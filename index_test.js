const through = require('through2');
const unCss= require('./lib/main/amp-uncss.js');

module.exports =  function(options) {
  // TODO: Make this work for optimizationLevel = 1. Currently, browsers are crashing before opt can be made.
  function gulpUnCss(vinyl, enc, cb) {
    if (vinyl.isBuffer()) {
      const processOpts = Object.assign(
          options,{
            streamable: true,
            report: !!options.report || !!options.reportDirectory || !!options.reportName
      });
      let uncss = new unCss([vinyl], processOpts);
      uncss.init()
          .then(uf => uf.run())
          .then(results => {
            let {optimizedHtmlString, reporting} = results;
            vinyl.contents = Buffer.from(optimizedHtmlString);
            uncss.end()
                .then( data => {
                  cb(null, vinyl);
                });
          })
    } else {
      cb(null, vinyl);
    }

  }
  return through.obj(gulpUnCss)
};