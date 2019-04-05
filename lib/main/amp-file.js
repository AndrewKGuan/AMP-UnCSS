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
      selectorsRemoved: {},
    };

    if (this.rawHtml.length === 0) {
      this.setFailure(performance.now(), 'Page contained no content');
    }
    if (this.rawHtml.includes(''))
    return this;
  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Promise<AmpFile>}
   */
  async prep() {
    if (this.hasFailed()) return this;

    this.setStatus('started', performance.now());


    this.staticDom = new CheerioInterface(this.rawHtml).init();
    this._stats.inputSize = Buffer.byteLength(this.staticDom.getHtml(), 'utf8');
    this.staticDom.stubAmpImg();

    const fileDomData = DomParser.extractDomData(this.staticDom);
    this._extractFileData(fileDomData);

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
   * Set instance properties for reference later
   * @param {*} data
   * @private
   */
  _extractFileData(data) {
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
   * Returns whether or not the AmpFile has a tag that would require Type 1
   *    optimizations.
   * @return {boolean}
   */
  hasExceptionTags() {
    return this._stats.hasExceptionTags =
        this._stats.hasExceptionTags || this.exceptionElementTags.size > 0;
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
      this.staticDom.removeAmpImgStubs();
      this.staticDom.replaceCustomStyles(this.parsedCss.toString());
      this.optimizedHtml = this.staticDom.getHtml()
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
      dirs.split('/').forEach((dir, i ,arr) => {
        const base = arr.slice(0, i + 1).join('/');
        if(!fs.existsSync(base)) {
          fs.mkdirSync(arr.slice(0, i + 1).join('/'))
        }
      })
    }
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
   * @description Generates and retrieves timing and optimization _stats
   *    for a given file.
   * @return {Object}
   */
  getCompletionStats() {
    this._stats.outputSize = this.optimizedHtml.length;
    this._stats.bytesRemoved = this._stats.inputSize - this._stats.outputSize;

    if(this.reportSize === 'small') {
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
          },

      );
    }

    return this._stats;
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
        // selectors: [prefixedSelector],
        count: 1,
      };
    } else {
      // this._stats.selectorsRemoved[selectorType].selectors
      //     .push(prefixedSelector);
      this._stats.selectorsRemoved[selectorType].count += 1;
    }
  }

  /**
   * @param {string} type
   * @param {number|string} value
   */
  setStatus(type, value) {
    this._stats.status[type] = value;
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
   * @return {boolean}
   */
  hasFailed() {
    return Boolean(this._stats.status && this._stats.status.failed);
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
}

module.exports = AmpFile;
