/**
 * @file Main entry point for UnCSS plugin.
 * @version 0.1
 */

const fs = require("fs"),
    puppeteer = require('puppeteer');

const typeZeroOptimizer = require('./typeZeroOptimizations'),
    typeOneOptimizer = require('./typeOneOptimizations'),
    AmpFile = require('./AmpFile'),
    defaultConfigs = require('../utils/defaultOptions');

/**
 @typedef {File} Vinyl - A virtual file format. When a file is read by src(),
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
   * @param {Array<string>} inputFilePaths
   * @param options - describes operating options for this use of UnCss
   * @param callback
   * @return {UnCss}
   */
  constructor(inputFilePaths, options, callback) {
    if(!Array.isArray(inputFilePaths)) {
      throw "UnCSS requires a list of filePaths in order to execute. Provided \
      input is not a list of files"
    }
    this.inputFilePaths = inputFilePaths;

    if(typeof options === 'function') {
      /** There are no options, this argument is actually the callback */
      callback = options;
      options = {};
    }

    if (typeof options === 'string') options = this._ingestConfigFile(options);
    if (options === undefined) options = {};
    // else if (typeof callback !== 'function') {
    //   console.warn("Callback provided is not a function. Will not execute.")
    // }

    let defaultOptions = defaultConfigs;

    /** Force reportName to include '.json'. */
    if(options.reportName && !options.reportName.includes('.json')) {
      options.reportName += '.json'
    }
    if(inputFilePaths.every(fp => fp.constructor.name === 'File')) {
      options.streamable = true
    }

    /** Assign default values to options, unless specified */
    this.options = {...defaultOptions, ...options};
    return this
  }

  async init() {
    if(!this.browser && this.options.optimizationLevel) {
      this.browser = await puppeteer.launch({
        args:['--shm-size=1gb'],
      }).catch(e => {throw e});
      await this.browser.on('disconnected',  () => {
        this.browser = null;
        console.log('browser crashed')
      });
      await this.browser.on('targetcreated', async (t) => {
        console.log(`Target Created: ${t.url()}`, );
      })
    }

    return this;
  }

  /**
   * @return {AmpFile[] | {reporting: Object, optimizedHtmlString: string}}
   */
  async run() {
    let ampFiles = await this._setup().catch(e => {throw e});
    ampFiles = await this._optimize(ampFiles).catch(e => {throw e});
    let results = await this._tearDown(ampFiles).catch(async err => {
      console.log('Uncss.teardown Error: ', err)
      if(this.browser) await this.browser.close()
      throw err
    });
    // await this.end();
    return results;
  }

  /**
   * Instantiates any necessary class instances with proper configurations
   * @return {AmpFile[]}
   * @private
   */
  async _setup() {
    let {options, browser} = this,
        ampFiles;

    if(options.report) this._initializeReport();

    ampFiles = await Promise.all(
      this.inputFilePaths.map( path => {
        return new AmpFile(path, options, browser)
            .prep()
            .catch(e => {throw e})
      })
    );
    return ampFiles
  }

  /**
   * Run appropriate file optimizations
   * @param {AmpFile[]} ampFiles
   * @private
   */
  async _optimize(ampFiles) {

    let staticOnlyGroup = ampFiles.reduce((acc, af) => {
      if(af.optimizationLevel === 0) acc.push(af);
      return acc
    }, []);
    let dynamicGroup = ampFiles.reduce((acc, af) => {
      if(af.optimizationLevel === 1) acc.push(af);
      return acc
    }, []);

    let staticGroupOptimized = staticOnlyGroup
        .map(af => {
          if(!af._stats.status.failed) return typeZeroOptimizer.optimize(af)
        });

    let dynamicGroupOptimized = await Promise.all(dynamicGroup.map(af => {
          if(!af._stats.status.failed){
            return typeOneOptimizer.optimize(af)
                .catch(e => {throw e})
          }
        }));

    let list = [...staticGroupOptimized, ...dynamicGroupOptimized];
    return list
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
    await Promise.all(ampFiles.map(af => {
      if(af._stats.status.failed) return;
      return af.rewriteHtmlWithNewCss()
          .then(async af => {
            af.saveCompletionStats();
            await af.closePage();
          })
          .catch(err => {
            console.log('AmpFile.rewriteHtmlWithNewCss Error: ', err);
            throw err
          })
    })).catch(err => {
      console.log('Failed Promise.all')
    });

    // Update report File if necessary.
    if (this.options.report) this._updateReportFile(ampFiles);


    if(this.options.streamable){
      // TODO Handle streamable results better, both successful and unsuccessful.
      if(ampFiles[0]._stats.status.failed) {
        return new Error('File optimization failed with error:' + ampFiles[0]._stats.error)
      }
      return {
        optimizedHtmlString: ampFiles[0].returnOptimizedHtml(),
        reporting: ampFiles[0]._stats
      }
    } else {
    // Bundle result files into output location
      ampFiles.forEach(file => {
        file.saveHtmlToDisc(this.options.targetDirectory, this.options.filenameDecorator);
      }, this);
      return ampFiles
    }

    // 3. Print necessary info to console
    // TODO
  }

  async end() {
    // Close Puppeteer.browser if it exists
    if(this.browser) await this.browser.close()
        .then(b => {
          console.log("browser successfully closed.")
        })
        .catch(err => {
          console.log('UnCss.browser.close() Error:' , err)
        });
    return this;
  }

  /**
   * Checks if given directory and filename exists. If not, creates both.
   * @private
   */
  _initializeReport() {
    if(!fs.existsSync(this.options.reportDirectory)) {
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

  async _ingestConfigFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
}

module.exports = function(files, options, callback) {
  return new UnCss(files, options, callback);
};