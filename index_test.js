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
const {Signale} = require('signale');

const AmpUnCss= require('./lib/main/amp-uncss.js');

module.exports = function(options) {
  const logger = new Signale({
    interactive: false,
    scope: 'AMP UnCss',
  });

  logger.start('Starting AMP UnCSS');

  const processOpts = Object.assign(
      options, {
        streamable: true,
        report:
            !!options.report ||
            !!options.reportDirectory ||
            !!options.reportName,
      });

  const unCss = new AmpUnCss([], processOpts);
  if (processOpts.optimizationLevel > 0) {
    // Initialize Puppeteer browser that will be shared across all pages.
    unCss.init();
    logger.note('Opening headless Puppeteer instance.');
  }
  if (processOpts.report) {
    unCss.initializeReport();
    logger.note('Initializing a report document.');
  }

  /**
   * @param {File} chunk
   * @param {string} enc
   * @param {function} cb
   */
  function newFunc(chunk, enc, cb) {
    if (chunk.isBuffer()) {
      unCss.run(chunk)
          .then((optimizedHtmlString) => {
            if (typeof optimizedHtmlString !== 'undefined') {
              // Only update stream data if the optimization was successful.
              chunk.contents = Buffer.from(optimizedHtmlString);
            }
            logger.complete(`Completed ${chunk.relative}.`);
            cb(null, chunk);
          });
    } else {
      cb(null, chunk);
    }
  }

  /**
   * Closes browser if open.
   * @param {function} done
   */
  function browserClose(done) {
    logger._interactive = false;
    if (unCss.browser) {
      unCss.browser.close();
      logger.note('Closing headless Puppeteer instasnce.');
    }
    logger.success('AMP UnCss Complete!');
    done();
  }
  logger._interactive = true;
  return through.obj(newFunc, browserClose);
};
