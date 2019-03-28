const through = require('through2');
const AmpUncss= require('./lib/main/amp-uncss.js');

module.exports = function(options) {
  /**
   * @param {File} vinyl
   * @param {string} enc
   * @param {function} cb
   */
  function gulpUnCss(vinyl, enc, cb) {
    if (vinyl.isBuffer() ) {
      const processOpts = Object.assign(
          options, {
            streamable: true,
            report:
                !!options.report
                || !!options.reportDirectory
                || !!options.reportName,
          });
      const uncss = new AmpUncss([vinyl], processOpts);
      uncss.init()
          .then((uf) => uf.run())
          .then(({optimizedHtmlString, reporting}) => {
            if (typeof optimizedHtmlString !== 'undefined') {
              // Only update stream data if the optimization was successful.
              vinyl.contents = Buffer.from(optimizedHtmlString);
            }
            uncss.end()
                .then( () => {
                  cb(null, vinyl);
                });
          });
    } else {
      cb(null, vinyl);
    }
  }
  return through.obj(gulpUnCss);
};
