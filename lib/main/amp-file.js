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
      this.fileExt = this.fileName.split('.')[1];
      this.fileDir = fileParts.join('/');
      this.rawHtml = fs.readFileSync(this.filePath, 'utf-8');
    }

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
    return this;
  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Promise<AmpFile>}
   */
  async prep() {
    this.setStatus('started', performance.now());


    this.staticDom = new CheerioInterface(this.rawHtml).init();
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
    return this.exceptionElementTags.size > 0;
  }

  /**
   * @description Translates the current AmpFile.$ to HTML and saves it to
   *    instance variable
   * @return {Promise<AmpFile>}
   */
  async rewriteHtmlWithNewCss() {
    if (this.optimizationLevel === 0) {
      this.staticDom.replaceCustomStyles(this.parsedCss.toString());
      this.optimizedHtml = this.staticDom.getHtml();
    } else if (this.optimizationLevel === 1) {
      await this.dynamicDom.replaceCustomStyles(this.parsedCss.toString())
          .catch((err) => {
            console.log('Error during AmpFile.rewriteHtmlWithNewCss(): ', err);
            this.setStatus('failed', performance.now());
          });
      this.optimizedHtml = await this.dynamicDom.getHtml()
          .catch((err) => {
            console.log('Error during AmpFile.rewriteHtmlWithNewCss():', err);
            this.setStatus('failed', performance.now());
          });
    }

    if (!this._stats.status.failed) {
      // Removes empty data attribute values (i.e. amp-custom="") and newlines
      this.optimizedHtml
          .replace(/="{2}/g, '')
          .replace(/\r\n/g, '\n')
          .replace(/\n/g, '');
      this.setStatus('complete', performance.now());
    }

    return this;
  }

  /**
   * Writes HTML to file and given path.
   * @param {string} targetDirectory - file save location
   * @param {?string} filenameDecorator - suffix for the input file name
   */
  saveHtmlToDisc(targetDirectory, filenameDecorator) {
    const fileName = this.fileName.split('.')[0];
    const fileType = this.fileName.split('.')[1];
    const decorator = filenameDecorator || '';
    this._outputFilePath =
        `./${targetDirectory}/${fileName + decorator}.${fileType}`;

    if (!fs.existsSync(`./${targetDirectory}`)) {
      fs.mkdirSync(`./${targetDirectory}`);
    }
    fs.writeFileSync(this._outputFilePath, this.optimizedHtml);
  }

  /**
   * Return Optimized HTML in String format
   *  Note: only used with
   * @return {string|*|void}
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
    this._stats.inputSize = this.inputType === 'File' ?
        this.rawHtml.length:
        fs.statSync(this.filePath).size;

    if (this._stats.status.complete) {
      this._stats.outputSize = this.optimizedHtml.length;
      this._stats.hasExceptionTags = this.hasExceptionTags();
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
   * @param {string }type
   * @param {number }time
   */
  setStatus(type, time ) {
    this._stats.status[type] = time;
  }

  /**
   * Close the Puppeteer.Page instance in order to reduce memory usage.
   * @return {Promise<boolean>}
   */
  async closePage() {
    if (this.dynamicDom) {
      await this.dynamicDom.shutdown();
    }
    return true;
  }
}

module.exports = AmpFile;
