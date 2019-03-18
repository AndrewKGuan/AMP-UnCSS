/**
 * @file File class to hold pertinent data about an optimization target file
 * @version 0.1
 */

const tags = require('../utils/tags'),
    DomParser = require("../interfaces/DomParser"),
    CheerioInterface = require('../interfaces/CheerioInterface'),
    PuppeteerInterface = require('../interfaces/PuppeteerInterface');

const fs = require('fs'),
    path = require('path'),
    {performance} = require('perf_hooks'),
    postcss = require('postcss');

/**
 *  Class representing an AMP HTML file.
 */
class AmpFile {

  /**
   * @param {File | string} filePath
   * @param {Object} browser
   * @param {Object} options
   * @return {AmpFile}
   */
  constructor(filePath, options, browser){

    this.browser = browser;
    this.optimizationTarget = options.optimizationLevel;

    if(options.streamable) {
      // Since file type is Vinyl (via Gulp API), we can use Vinyl methods for URL parsing.
      this.inputType = 'File';
      this.filePath = filePath.path;
      this.fileName = filePath.basename;
      this.fileDir = filePath.base;
      this.fileExt = filePath.extname;
      this.rawHtml = String(filePath.contents);
    }
    else {
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
      selectorsRemoved: {}
    };
    return this;
  }

  /**
   * Utilize a DOM Parser in order to construct a static DOM for parsing
   *    and analysis for future optimizations
   * @return {Object} Static DOM representation of file HTML.
   */
  async prep() {
    this.setStatus('started', performance.now());


    this.staticDom = new CheerioInterface(this.rawHtml).init();
    this.staticDom.stubAmpImg();

    let fileDomData = DomParser.extractDomData(this.staticDom);
    this._extractFileData(fileDomData);
    // If we don't have to run Puppeteer, set a flag to refer to later in order
    // to skip the slower operations.
    if(this.optimizationTarget > 0 && this.hasExceptionTags()) {
      this.optimizationLevel = 1;
    }
    else this.optimizationLevel = 0;

    if(this.optimizationLevel === 1) {
      let tempFilePath;
      if(this.inputType === 'File') {
        tempFilePath = './vinylTemp.html'
        fs.writeFileSync(tempFilePath, this.rawHtml, 'utf-8')
      } else {
        tempFilePath = this.filePath;
      }
      tempFilePath = path.join('file://',path.resolve('.'), tempFilePath);
      this.dynamicDom = await new PuppeteerInterface(tempFilePath).init(this.browser)
    }

    /**
     * @description Parsed version of raw CSS for traversal and mutation.
     * @type {postcss.Root}
     */
    this.parsedCss = postcss.parse(this.rawCss);
    return this
  }

  /**
   * Set instance properties for reference later
   * @param data
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
   * Returns whether or not the AmpFile has a tag that would require Type 2
   *    optimizations. Checks AmpFile object variable to see if file has been
   *    run before.
   * @return {boolean} this._hasExceptionTag
   */
  hasExceptionTags() {
    return this.exceptionElementTags.size > 0;
  }

  /**
   * @description Translates the current AmpFile.$ to HTML and saves it to instance variable
   */
  async rewriteHtmlWithNewCss() {
    if(this.optimizationLevel === 0) {
      this.staticDom.replaceCustomStyles(this.parsedCss.toString());
      this.optimizedHtml = this.staticDom.getHtml();

    } else if(this.optimizationLevel === 1){

      await this.dynamicDom.replaceCustomStyles(this.parsedCss.toString())
          .catch(err => {
            console.log('PuppeteerInterface.replaceCustomStyles Error: ', err)
            this.setStatus('failed', performance.now())
          });
      this.optimizedHtml = await this.dynamicDom.getHtml()
          .catch(err => {
            console.log('PuppeteerInterface.getHtml Error:' , err)
            this.setStatus('failed', performance.now())
          });
    }

    if(!this._stats.status.failed) {
      this.optimizedHtml.replace(/="{2}/g, "").replace(/\r\n/g, '\n').replace(/\n/g,"");
      this.setStatus('complete', performance.now());
    }

    return this
  }

  /**
   * Writes HTML to file and given path.
   * @param {string} targetDirectory - directory path where the file is to be saved.
   * @param {?string} filenameDecorator - String to be appended to input file name
   *    to differentiate the file
   */
  saveHtmlToDisc(targetDirectory, filenameDecorator) {
    const fileName = this.fileName.split('.')[0];
    const fileType = this.fileName.split('.')[1];
    const decorator = filenameDecorator || '';
    this._outputFilePath = `./${targetDirectory}/${fileName + decorator}.${fileType}`;

    if(!fs.existsSync(`./${targetDirectory}`)) {
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
   * @description Generates and retrieves timing and optimization _stats for a given filePath.
   * @return {{fileName: string,
   *    status: Object,
   *    inputSize: number,
   *    outputSize: number,
   *    selectorsRemoved: number}}
   */
  saveCompletionStats() {
    this._stats.inputSize = this.inputType === 'File' ?
        this.rawHtml.length:
        fs.statSync(this.filePath).size;

    if(this._stats.status.complete) {
      this._stats.outputSize = this.optimizedHtml.length;
      this._stats.hasExceptionTags = this.hasExceptionTags();
    }

    return this._stats;
  }

  /**
   * @description Increases "selectorsRemoved" stat by 1.
   * @param {string} selectorType - Type of selector removed.
   * @param {string} prefixedSelector - Specific selector removed, prefixed with # or . if id or class selector, respectively .
   * @return {number}
   */
  incrementSelectorsRemoved(selectorType, prefixedSelector) {
    if(!this._stats.selectorsRemoved[selectorType]) {
      this._stats.selectorsRemoved[selectorType] = {
        selectors: [prefixedSelector],
        count: 1,
      };
    } else {
      this._stats.selectorsRemoved[selectorType].selectors.push(prefixedSelector);
      this._stats.selectorsRemoved[selectorType].count += 1;
    }
  }

  setStatus(type,time ) {
    this._stats.status[type] = time;
  }

  async closePage() {
    if(this.dynamicDom) {
      this.dynamicDom.shutdown();
    }
  }

}

module.exports = AmpFile;