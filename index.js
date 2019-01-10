const through = require('through2');
const unCss= require('./lib/main/UnCss.js');

module.exports =  function(options) {
  function gulpUnCss(vinyl, enc, cb) {
    if (vinyl.isBuffer()) {
      let {optimizedHtmlString, reporting} = unCss(
          vinyl,
          Object.assign(options, {streamable: true}),
          cb);

      vinyl.contents = Buffer.from(optimizedHtmlString);
    }

    cb(null, vinyl);
  }
  return through.obj(gulpUnCss)
};