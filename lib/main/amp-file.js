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
 * @file File class to hold pertinent data about an optimization target file
 * @version 0.1
 */
const fs = require('fs');
const path = require('path');
const {performance} = require('perf_hooks');
const postcss = require('postcss');

const CheerioInterface = require('../interfaces/cheerio-interface.js');
const PuppeteerInterface = require('../interfaces/puppeteer-interface.js');
const DomParser = require('../main/dom-parser.js');
const TypeOneOptimizer = require('../main/type-one-optimizations.js');
const TypeZeroOptimizer = require('../main/type-zero-optimizations.js');

/**
 *  Class representing an AMP HTML file.
 */
class AmpFile {
  /**
   * @param {File | string} filePath
   * @param {Object} options
   * @param {Object} browser
   * @return {AmpFile}
   */
  constructor(filePath, options, browser) {
    this.browser = browser;
    this.optimizationTarget = options.optimizationLevel;
    this.reportSize = options.reportSize;

    if (options.streamable) {
      // Since file type is Vinyl (via Gulp API), we can use Vinyl methods for
      // URL parsing.
      this.inputType = 'File';
      this.filePath = filePath.path;
      this.fileName = filePath.basename;
      this.fileDir = filePath.base;
      this.fileExt = filePath.extname;
      this.rawHtml = String(filePath.contents);
    } else {
      this.inputType = 'string';
      const fileParts = filePath.split('/');
      this.filePath = filePath;
      this.fileName = fileParts.pop();
      this.fileExt = this.fileName.split('.').pop();
      this.fileDir = fileParts.join('/');
      this.rawHtml = fs.readFileSync(this.filePath, 'utf-8');
    }
    this.garbage = {};
    const fileNameParts = this.fileName.split('.');
    const fileType = fileNameParts.pop();
    const fileName = fileNameParts.join('.');
    const decorator = options.filenameDecorator || '';
    this.outputFilePath =
        `./${options.targetDirectory}/${this.fileDir}`;
    this.outputFileName = `${fileName + decorator}.${fileType}`;

    /**
     * @description Holds all optimization statistics for later reporting.
     */
    this._stats = {
      fileName: this.fileName,
      status: {'instantiated': performance.now()},
      inputSize: 0,
      outputSize: 0,
      selectorsRemoved: [],
    };
    this.selectorWhiteList = options.selectorWhiteList || [];


    if (this.rawHtml.length === 0) {
      this.setFailure(performance.now(), 'Page contained no content');
    }
    return this;
  }

  /**
   * Add a warning to file status
   * @param {number} time
   * @param {string} warning
   */
  addWarning(time, warning) {
    if (this._stats.status.warning) {
      this._stats.status.warnings.push({time, warning});
    } else {
      this._stats.status.warnings = [{time, warning}];
    }
  }

  /**
   * Checks the selector whitelist for given selector.
   * @param {string} selector
   * @return {boolean}
   */
  isSelectorWhitelisted(selector) {
    return this.selectorWhiteList && this.selectorWhiteList.includes(selector);
  }

  /**
   * @return {Promise<AmpFile>}
   */
  async execute() {
    return this.prep()
        .catch((err) => { // Prep failed
          this.setFailure(performance.now(), err);
          return this;
        })
        .then((ampFile) => ampFile.optimize())
        .catch((err) => { // Optimize failed
          this.setFailure(performance.now(), err);
          return this;
        })
        .then((ampFile) => ampFile.teardown())
        .catch((err) => { // Teardown failed
          this.setFailure(performance.now(), err);
          return this;
        });
  }

  /**
   * Set instance properties for reference later
   * @param {*} data
   * @private
   */
  extractFileData(data) {
    this.rawCss = data.joinedRawCss;
    this.escapedPseudos = data.escapedPseudos;
    this.pseudos = data.pseudos;
    this.general = data.general;
    this.commaSeparatedSelectors = data.commaSeparatedSelectors;
    this.ampElementSelectors = data.ampElementSelectors;
    this.keyFrames = data.keyFrames;
    this.exceptionElementTags = data.exceptionElementTags;
  }

  /**
   * @description Generates and retrieves timing and optimization _stats
   *    for a given file.
   * @return {Object}
   */
  getCompletionStats() {
    this._stats.outputSize = this.optimizedHtml.length;
    this._stats.bytesRemoved = this._stats.inputSize - this._stats.outputSize;

    if (this.reportSize === 'small') {
      return Object.assign(
          {},
          {outputFilePath: this.outputFilePath},
          {outputFileName: this.outputFileName},
          {
            inputSize: this._stats.inputSize,
            outputSize: this._stats.outputSize,
            bytesRemoved: this._stats.bytesRemoved,
            status: this._stats.status,
            selectorsRemoved: this._stats.selectorsRemoved,
            whitelist: this.selectorWhiteList
          },
      );
    }

    return this._stats;
  }

  /**
   * Returns whether or not the AmpFile has a tag that would require Type 1
   *    optimizations.
   * @return {boolean}
   */
  hasExceptionTags() {
    return this._stats.hasExceptionTags =
        this._stats.hasExceptionTags || this.exceptionElementTags.size > 0;
  }

  /**
   * @description Increases "selectorsRemoved" stat by 1.
   * @param {string} selectorType - Type of selector removed.
   * @param {string} prefixedSelector - Specific selector removed, prefixed with
   *    # or . if id or class selector, respectively .
   */
  incrementSelectorsRemoved(selectorType, prefixedSelector) {
    if (!this._stats.selectorsRemoved[selectorType]) {
      this._stats.selectorsRemoved[selectorType] = {
        selectors: [prefixedSelector],
        count: 1,
      };
    } else {
      this._stats.selectorsRemoved[selectorType].selectors
          .push(prefixedSelector);
      this._stats.selectorsRemoved[selectorType].count += 1;
    }
  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Promise<AmpFile>}
   */
  async prep() {
    if (this.hasFailed()) return this;

    this.setStatus('started', performance.now());


    this.staticDom = new CheerioInterface(this.rawHtml).init(this);
    this._stats.inputSize = Buffer.byteLength(
        this.staticDom.getOriginalHtml(),
        'utf8'
    );

    const fileDomData = DomParser.extractDomData(this.staticDom);
    this.extractFileData(fileDomData);

    // If we don't have to run Puppeteer, set a flag to refer to later in order
    // to skip the slower operations.
    if (this.optimizationTarget > 0 && this.hasExceptionTags()) {
      this.optimizationLevel = 1;
    } else this.optimizationLevel = 0;

    if (this.optimizationLevel === 1) {
      let tempFilePath;
      if (this.inputType === 'File') {
        // File input gives access to a buffered string rather than a source
        //    file. Puppeteer includes two ways to instantiate a new page:
        //    Page.goto(sourceLocation) or Page.setContent(sourceData).
        //    While using Page.setContent with a raw HTML string would
        //    circumvent the additional overhead of writing and destroying the
        //    temp file, during testing, this method resulted in the page
        //    failing to load dynamic resources linked to on the page (i.e.
        //    amp-list would not request or load resources. Therefore we must
        //    write the buffered string to a file and load the file using
        //    Page.goto().
        tempFilePath = './vinylTemp.html';
        fs.writeFileSync(tempFilePath, this.rawHtml, 'utf-8');
      } else {
        tempFilePath = this.filePath;
      }
      const tempAccessPath = path.join(
          'file://',
          path.resolve('.'),
          tempFilePath
      );
      this.dynamicDom = await new PuppeteerInterface(tempAccessPath)
          .init(this.browser);

      // Delete temporary file
      if (tempFilePath === './vinylTemp.html') {
        fs.unlinkSync(tempFilePath);
      }
    }

    /**
     * @description Parsed version of raw CSS for traversal and mutation.
     * @type {postcss.Root}
     */
    this.parsedCss = postcss.parse(this.rawCss);
    return this;
  }

  /**
   * Return Optimized HTML in String format
   *  Note: only used with
   * @return {string|void}
   */
  returnOptimizedHtml() {
    return this.optimizedHtml;
  }

  /**
   * @description Translates the current AmpFile.$ to HTML and saves it to
   *    instance variable
   * @return {Promise<AmpFile>}
   */
  async rewriteHtmlWithNewCss() {
    if (!this.hasFailed()) {
      // We can rebuild off the static DOM since we only need to update the
      //    original HTML with the new CSS. Use CheerioInterface rather than
      //    rawHtml because it's easier to manipulate the DOM representation
      //    than it is to manipulate the string representation.
      this.staticDom.replaceCustomStyles(this.parsedCss.toString());
      this.optimizedHtml = this.staticDom.getOriginalHtml()
          .replace(/="{2}/g, '');
      // Removes empty data attribute values (i.e. amp-custom="") and newlines
      this.setStatus('complete', performance.now());
    } else {
      // If the file has failed at some point, just return the input and report
      //    the failure
      this.optimizedHtml = this.rawHtml || '';
    }

    return this;
  }

  /**
   * Writes HTML to file and given path.
   * @param {string} targetDirectory - file save location
   * @param {?string} filenameDecorator - suffix for the input file name
   */
  saveHtmlToDisc(targetDirectory, filenameDecorator) {
    buildNeededDirs(this.outputFilePath);

    fs.writeFileSync(
        this.outputFilePath + '/' + this.outputFileName,
        this.optimizedHtml);

    /**
     * Provided a directory location, adds all necessary directories within the
     *    chain.
     * @param {string} dirs - directory location
     */
    function buildNeededDirs(dirs) {
      dirs.split('/').forEach((dir, i, arr) => {
        const base = arr.slice(0, i + 1).join('/');
        if (!fs.existsSync(base)) {
          fs.mkdirSync(arr.slice(0, i + 1).join('/'));
        }
      });
    }
  }

  /**
   * Sets time of failure and reason for failure
   * @param {number} time
   * @param {string} reason
   */
  setFailure(time, reason) {
    this.setStatus('failed', time);
    this.setStatus('failure-msg', reason);
  }

  /**
   * @param {string} type
   * @param {number|string} value
   */
  setStatus(type, value) {
    this._stats.status[type] = value;
  }


  /**
   * @return {boolean}
   */
  hasFailed() {
    return Boolean(this._stats.status && this._stats.status.failed);
  }

  /**
   * Close the Puppeteer.Page instance in order to reduce memory usage.
   * @return {Promise<boolean>}
   */
  async closePage() {
    return new Promise((resolve) => {
      if (this.dynamicDom) {
        this.dynamicDom.shutdown()
            .catch((err) => {
              this.addWarning(performance.now(),
                  `Error shutting down Puppeteer.Page for 
                  ${this.fileName}: ${err}`);
            });
      }
      resolve(true);
    });
  }

  /**
   * Method to access Cheerio Interface count method.
   * @param {string} selector
   * @return {number}
   */
  staticDomCount(selector) {
    try {
      return this.staticDom.count(selector);
    } catch (err) {
      this.addWarning(performance.now(),
          'Failed AmpFile.staticDomCount: ' + err);
      // Return a non-zero value so that the tested CSS is not deleted.
      return 1;
    }
  }

  /**
   * Method to access Puppeteer Interface count method.
   * @param {string} selector
   * @return {Promise<number>}
   */
  async dynamicDomCount(selector) {
    return this.dynamicDom.count(selector)
        .then((count) => count)
        .catch((err) => {
          this.addWarning(performance.now(),
              'Failed AmpFile.dynamicDomCount: ' + err);
          // Return a non-zero value so that the tested CSS is not deleted.
          return 1;
        });
  }

  /**
   * Method to access Puppeteer Interface queryAll method.
   * @param {string} selector
   * @return {Promise<
   *    {els: {id: {string}, className: {string}}[],
   *    count: number}
   *    >}
   */
  async dynamicQueryAll(selector) {
    return this.dynamicDom.queryAll(selector)
        .then((data) => data)
        .catch((err) => {
          this.addWarning(performance.now(),
              'Failed AmpFile.dynamicQueryAll: ' + err);
          // Return a non-zero value so that the tested CSS is not deleted.
          return 1;
        });
  }

  /**
   * Rewrite file and get final stats.
   * @return {Promise<AmpFile>}
   */
  async teardown() {
    await this.rewriteHtmlWithNewCss().catch((err) => {
      this.setFailure(performance.now(), err);
    });

    await this.closePage();
    return this;
  }

  /**
   * @return {Promise<AmpFile>}
   */
  async optimize() {
    if (!this.hasFailed()) {
      if (this.optimizationLevel === 0 ) {
        return TypeZeroOptimizer.optimize(this);
      } else if (this.optimizationLevel === 1) {
        return await TypeOneOptimizer.optimize(this);
      }
    }
    return this;
  }
}

module.exports = AmpFile;
