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
   * @param {function} callback
   * @return {AmpUncss}
   */
  constructor(inputFilePaths, options, callback) {
    if (!Array.isArray(inputFilePaths)) {
      throw Error('UnCSS requires a list of filePaths in order to'
      + 'execute. Provided input is not a list of files');
    }
    this.inputFilePaths = inputFilePaths;

    if (typeof options === 'function') {
      /** There are no options, this argument is actually the callback */
      callback = options;
      options = {};
    }

    // We need to use this during _teardown phase and don't want to require
    // it as a separate input
    if (callback && typeof callback === 'function') {
      this.cb = callback;
    }

    if (typeof options === 'string') options = this._ingestConfigFile(options);
    if (options === undefined) options = {};
    // else if (typeof callback !== 'function') {
    //   console.warn("Callback provided is not a function. Will not execute.")
    // }

    const defaultOptions = defaultConfigs;

    /** Force reportName to include '.json'. */
    if (options.reportName && !options.reportName.includes('.json')) {
      options.reportName += '.json';
    }
    if (inputFilePaths.every((fp) => fp.constructor.name === 'File')) {
      options.streamable = true;
    }

    /** Assign default values to options, unless specified */

    // this.options = {defaultOptions, options};
    this.options = Object.assign(defaultOptions, options);
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
          .then((b) => {
            console.log(`New browser opened.`);
            return b;
          })
          .catch((err) => {
            throw err;
          });
      await this.browser.on('disconnected', () => {
        this.browser = null;
        console.log('Browser closed.');
      });
      await this.browser.on('targetcreated', async (t) => {
        console.log(`Target Created: ${t.url()}`, );
      });
    }

    return this;
  }

  /**
   * jkvf
   * @return {Promise<void>}
   */
  async run() {
    console.log('Setting up process...');
    const {options, browser} = this;
    if (options.report) this._initializeReport();

    return Promise.all(this.inputFilePaths.map( (filePath) => {
      return new AmpFile(filePath, options, browser)
          .prep()
          .catch((err) => err) // Prep failed
          .then((ampFile) => ampFile.optimize())
          .catch((err) => err) // Optimize failed
          .then((ampFile) => ampFile.teardown())
          .catch((err) => err); // Teardown failed
    }))
        .then((ampFiles) => {
          return this.cleanup(ampFiles);
        });
  }

  /**
   *
   * @param {AmpFile[]} ampFiles
   * @return {AmpFile[] | {optimizedHtmlString: string, reporting, Object}}
   */
  cleanup(ampFiles) {
    if (this.options.report) this._updateReportFile(ampFiles);

    if (this.options.streamable) {
      // TODO Handle successful and unsuccessful streamable results better.
      return {
        optimizedHtmlString: ampFiles[0].returnOptimizedHtml(),
        reporting: ampFiles[0]._stats,
      };
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
    // Close Puppeteer.browser if it exists
    if (this.browser) {
      await this.browser.close()
          .then((b) => {
            // console.log('Browser successfully closed.');
          })
          .catch((err) => {
            console.log('AmpUncss.browser.close() Error:', err);
          });
    }
    return this;
  }

  /**
   * Checks if given directory and filename exists. If not, creates both.
   * @private
   */
  _initializeReport() {
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
      newTest.files.push(file._stats);
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
  async _ingestConfigFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}

module.exports = function(files, options, callback) {
  return new AmpUncss(files, options, callback);
};
