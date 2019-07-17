/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



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
