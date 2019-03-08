/**
 * @file Main entry point for UnCSS plugin.
 * @version 0.1
 */

const fs = require("fs");
const puppeteer = require('puppeteer');
const typeZeroOptimizations = require('./typeZeroOptimizations');
const typeOneOptimizations = require('./typeOneOptimizations');
const typeTwoOptimizations = require('./typeTwoOptimizations');
const FinalOptimizer = require('./FinalOps');
const AmpFile = require('./AmpFile');


/**
 @typedef {{contents: ReadableStream,
            stat: object,
            cwd: string,
            base: string,
            path: string,
            history: string,
            relative: string,
            dirname: string,
            stem: string,
            extname: string,
            basename: string,
            symlink: string,
            isBuffer: function,
            isStream: function,
            isNull: function,
            isDirectory: function,
            isSymbolic: function,
            clone: function,
            inspect: function
            }} Vinyl - A virtual file format. When a file is read by src(),
    a Vinyl object is generated to represent the file - including the path,
    contents, and other metadata.
 */

/**
 * @description UnCss Instance.
 */
class UnCss {

  /**
   * Should only be instantiated with options.streamable = true if being used with
   *  file input as Gulp Vinyl type.
   * @param {Vinyl | string[]} files - List of all files or Vinyls to process.
   * @param options - describes operating options for this use of UnCss
   * @param {number} [options.optimizationLevel = 0] - Define how much processing should be done. Correlates with TypeOps classes used.
   * @param {string} [options.targetDirectory] - Name of directory where files will be output
   * @param {string} [options.reportDirectory] - Directory path for report file output.
   * @param {string} [options.filenameDecorator] -  The decorator appended to input file names when written to target directory. E.g. optimized === inputFile_optimized.html
   * @param {string} [options.reportName = amp_uncss_report.json] - Report filename
   * @param callback
   * @return {AmpFile[] | {reporting: Object, optimizedHtmlString: string}}
   */
  constructor( options, callback) {
    if(typeof options === 'function') {
      /** There are no options, this argument is actually the callback */
      callback = options;
      options = {};
    }

    if (options === undefined) {
      options = {};
    }
    // else if (typeof callback !== 'function') {
    //   console.warn("Callback provided is not a function. Will not execute.")
    // }

    let defaultOptions = {
      optimizationLevel : 0,
      streamable: false,
      reportName: 'amp_uncss_report.json',
      reportDirectory: 'reports',
      targetDirectory: './dist',
      filenameDecorator: null,
      report: false
    };

    /** Force reportName to include '.json'. */
    if(options.reportName) {
      if(options.reportName.indexOf('.json') === -1) {
        options.reportName += '.json'
      }
      // if(!(options.reportName.split('.').length > 1 && options.reportName.split('.')[1] === 'json')) {
      //   options.reportName += '.json';
      // }
    }

    /** Assign default values to options, unless specified */
    this.options = {...defaultOptions, ...options};
    return this
  }

  /**
   * @param {Vinyl | string[]} files
   * @return {AmpFile[] | {reporting: Object, optimizedHtmlString: string}}
   */
  async run(files) {
    if (this.options.optimizationLevel > 0) {
      this.browser = await puppeteer.launch({headless:false})
    }
    const ampFiles = await this._setup(files);
    this._optimize(ampFiles);
    return await this._tearDown(ampFiles);
  }

  /**
   * Instantiates any necessary class instances with proper configurations
   * @param {Vinyl | string[]} files
   * @return {AmpFile[]}
   * @private
   */
  async _setup(files) {
    if(this.options.report) {
      this._initializeReport();
    }

    let {browser} = this,
        ampFiles;
    if (this.options.streamable) {
      ampFiles = [await new AmpFile(files,'streamable').prep(this.options, browser)]
    } else {
      ampFiles = await Promise.all(files
          .map(async file => {
            return await new AmpFile(file).prep(this.options, browser)
          }, this))
    }
    return ampFiles
  }

  /**
   * Run appropriate file optimizations
   * @param {AmpFile[]} ampFiles
   * @private
   */
  _optimize(ampFiles) {
    ampFiles.forEach( ampFile => {
      if(ampFile._stats.status === 'failed') {
        return
      }
      
      if (this.options.optimizationLevel === 0) {
        typeZeroOptimizations.optimize(ampFile);
      } else {
        typeOneOptimizations.optimize(ampFile);
      }
    }, this)
  }

  /**
   * Does any post processing necessary to prepare packages for final handling
   * @param {AmpFile[]} ampFiles
   * @return {AmpFile[] | Error | {
   *   reporting: object,
   *   optimizedHtmlString: string
   * }}
   * @private
   */
  async _tearDown(ampFiles) {
    // Reconstruct files based off final state
    ampFiles.forEach(async file => {
      if(file._stats.status === 'failed') return;
      file.prepData(this.options);
      file.stats()
      if(this.options > 0) {
        await file.dynamicDom.shutdown();
      }
    }, this);

    // Update report File if necessary.
    if (this.options.report) {
      this._updateReportFile(ampFiles)
    }

    // Close Puppeteer.browser if it exists
    if(this.options.optimizationLevel > 0) this.browser.close()

    if(this.options.streamable){
      if(ampFiles[0]._stats.status === 'failed') {
        return new Error('File optimization failed with error:' + ampFiles[0]._stats.error)
      }
      return {
        optimizedHtmlString: ampFiles[0].returnOptimizedHtml(),
        reporting: ampFiles[0]._stats
      }
    } else {
    // Bundle result files into output location
      ampFiles.forEach(file => {
        file.writeData(this.options.targetDirectory, this.options.filenameDecorator);
      }, this);
      return ampFiles
    }

    // 3. Print necessary info to console
  }

  /**
   * Checks if given directory and filename exists. If not, creates both.
   * @private
   */
  _initializeReport() {

    // check for reportDir
    if(!fs.existsSync(this.options.reportDirectory)) {
      // mkdir
      fs.mkdirSync(this.options.reportDirectory)
    }

    // check for report
    if(!fs.existsSync(this.options.reportDirectory + '/' + this.options.reportName)) {
      fs.writeFileSync(this.options.reportDirectory + '/' + this.options.reportName, JSON.stringify({tests:[]}) )
    }
  }

  _updateReportFile(ampFiles) {
    const reportJson =  JSON.parse(
        fs.readFileSync(
        this.options.reportDirectory + '/' + this.options.reportName
        ).toString());

    const newTest = {
      date: new Date().toString(),
      options: this.options,
      files:[]
    };

    ampFiles.forEach(file => {
      newTest.files.push(file._stats)
    });

    reportJson.tests.push(newTest);

    fs.writeFileSync(
        this.options.reportDirectory + '/' + this.options.reportName ,
        JSON.stringify(reportJson)
    );
  }
}

module.exports = function(files, options, callback) {
  return new UnCss(files, options, callback);
};