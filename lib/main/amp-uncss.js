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

/**
 * @file Main entry point for UnCSS plugin.
 * @version 0.1
 */

const fs = require('fs');
const puppeteer = require('puppeteer');

const AmpFile = require('./amp-file.js');
const defaultConfigs = require('../utils/default-options.js');

/**
 @typedef {File} Vinyl - A virtual file format. When a file is read by src(),
    a Vinyl object is generated to represent the file - including the path,
    contents, and other metadata.
 */

/**
 * @description AmpUncss Instance.
 */
class AmpUncss {
  /**
   * Should only be instantiated with options.streamable = true if being used
   *    with file input as Gulp Vinyl type.
   * @param {Array<string>} inputFilePaths
   * @param {Object} options - describes operating options for
   * @return {AmpUncss}
   */
  constructor(inputFilePaths, options) {
    if (!Array.isArray(inputFilePaths)) {
      throw Error('UnCSS requires a list of filePaths in order to'
      + 'execute. Provided input is not a list of files');
    }
    this.inputFilePaths = inputFilePaths;
    options = options || {};

    if (typeof options === 'string') {
      options = AmpUncss._ingestConfigFile(options);
    }

    const defaultOptions = defaultConfigs;

    /** Force reportName to include '.json'. */
    if (options.reportName && !options.reportName.includes('.json')) {
      options.reportName += '.json';
    }
    if (inputFilePaths.every((fp) => fp.constructor.name === 'File')) {
      options.streamable = true;
    }

    /** Assign default values to options, unless specified */
    this.options = Object.assign({}, defaultOptions, options);

    return this;
  }

  /**
   * If Puppeteer.Browser is necessary, initiate one.
   * @return {Promise<AmpUncss>}
   */
  async init() {
    if (!this.browser && this.options.optimizationLevel > 0) {
      this.browser = await puppeteer.launch({
        args: ['--shm-size=1gb'],
      })
          .catch((err) => {
            throw err;
          });
      await this.browser.on('disconnected', () => {
        this.browser = null;
        if (!this.options.streamable) console.log('Browser closed.');
      });
    }

    return this;
  }

  /**
   * Generates list of AmpFiles from provided file paths and awaits their
   *    optimization.
   * @param {File} chunk - portion of stream from Gulp
   * @return {Promise<AmpFile[]> | string}
   */
  async run(chunk = null) {
    const {options, browser} = this;
    let ampFileOrFiles;
    if (chunk === null) {
      if (options.report) this.initializeReport();

      ampFileOrFiles = this.inputFilePaths
          .map((fp) => new AmpFile(fp, options, browser));

      ampFileOrFiles = await this.executor(ampFileOrFiles);
    } else {
      ampFileOrFiles = new AmpFile(chunk, options, browser);
      await ampFileOrFiles.execute();
    }
    return this.cleanup(ampFileOrFiles);
  }

  /**
   * Breaks list of ampFiles into smaller batches in order to conserve memory.
   *    Each batch contains several AmpFiles that are optimized concurrently,
   *    but batches execute serially.
   * @param {array<AmpFile>}ampFiles
   * @return {Promise<Array>}
   */
  async executor(ampFiles) {
    const results = [];
    const count = ampFiles.length;
    const {batchSize} = this.options;
    let promiseChain = Promise.resolve();

    for (let i = 0; i < count; i += batchSize) {
      promiseChain = promiseChain
          .then(() => {
            return Promise.all(
                ampFiles
                    .slice(i, i + batchSize)
                    .map((af) => ampFileAsyncOptimizationWrapper(af))
            );
          });
    }
    await promiseChain;
    return results;

    /**
     * Wraps AmpFile execution in a promise, pushing the optimized AmpFile
     *    to the results array.
     * @param {AmpFile} ampFile
     * @return {Promise<any>}
     */
    function ampFileAsyncOptimizationWrapper(ampFile) {
      return new Promise((res) => {
        ampFile.execute()
            .then((af) => {
              results.push(af);
              res(af);
            });
      });
    }
  }

  /**
   *
   * @param {AmpFile[] | AmpFile} ampFiles
   * @return {AmpFile[] | string}
   */
  cleanup(ampFiles) {
    if (this.options.report) {
      if (Array.isArray(ampFiles)) this._updateReportFile(ampFiles);
      else this._updateReportFile([ampFiles]);
    }

    if (this.options.streamable) {
      // TODO Handle successful and unsuccessful streamable results better.
      return ampFiles.returnOptimizedHtml();
    } else {
      // Bundle result files into output location
      ampFiles.forEach((file) => {
        file.saveHtmlToDisc(
            this.options.targetDirectory, this.options.filenameDecorator);
      }, this);
      return ampFiles;
    }
  }

  /**
   * If open, close browser to reduce memory usage.
   * @return {Promise<AmpUncss>}
   */
  async end() {
    if (this.browser) {
      await this.browser.close()
          .catch((err) => {
            console.log('AmpUncss.browser.close() Error:', err);
          });
    }
    return this;
  }

  /**
   * Checks if given directory and filename exists. If not, creates both.
   */
  initializeReport() {
    if (!fs.existsSync(this.options.reportDirectory)) {
      fs.mkdirSync(this.options.reportDirectory);
    }

    // check for report
    if (!fs.existsSync(
        this.options.reportDirectory + '/' + this.options.reportName)) {
      fs.writeFileSync(
          this.options.reportDirectory + '/' + this.options.reportName,
          JSON.stringify({tests: []}) );
    }
  }

  /**
   * @param {AmpFile[]} ampFiles
   * @private
   */
  _updateReportFile(ampFiles) {
    const reportJson = JSON.parse(
        fs.readFileSync(
            this.options.reportDirectory + '/' + this.options.reportName
        ).toString());

    const newTest = {
      date: new Date().toString(),
      options: this.options,
      files: [],
    };

    ampFiles.forEach((file) => {
      newTest.files.push(file.getCompletionStats());
    });

    reportJson.tests.push(newTest);

    fs.writeFileSync(
        this.options.reportDirectory + '/' + this.options.reportName,
        JSON.stringify(reportJson)
    );
  }

  /**
   * @param {string} filePath
   * @return {Promise<Object>}
   * @private
   */
  static async _ingestConfigFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}

module.exports = function(files, options, callback) {
  return new AmpUncss(files, options, callback);
};
