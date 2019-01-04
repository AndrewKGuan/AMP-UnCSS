/**
 * @file Main entry point for UnCSS plugin.
 * @version 0.1
 */

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
   * @param {string} [options.outputDir = dist] - Name of directory where files will be output
   * @param {boolean} [options.minify = false] - Implements FinalOps.minify on inputs
   * @param {boolean} [options.compress = false] - Implements FinalOps.compress on inputs.
   * @param callback
   * @return {AmpFile[] | {reporting: Object, optimizedHtmlString: string}}
   */
  constructor(files, options, callback)
  {
    const defaultOptions = {
      optimizationLevel : 0,
      outputDir: "dist",
      fileNameDecorator: null,
      streamable: false,
      minify : false,
      compress : false,
    };

    if(typeof options === 'function') {
      /** There are no options, this argument is actually the callback */
      callback = options;
      options = {};
    } else if (typeof callback !== 'function') {
      throw new TypeError("AMP UnCss: expected a callback.")
    }

    /** Assign default values to options, unless specified */
    this.options = Object.assign(defaultOptions, options);
    return this.run(files)
  }

  /**
   * @param {Vinyl | string[]} files
   * @return {AmpFile[] | {reporting: Object, optimizedHtmlString: string}}
   */
  run(files) {
    const ampFiles = this._setup(files);
    this._optimize(ampFiles);
    return this._tearDown(ampFiles);
  }

  /**
   * Instantiates any necessary class instances with proper configurations
   * @param {Vinyl | string[]} files
   * @return {AmpFile[]}
   * @private
   */
  _setup(files) {
    return this.options.streamable ?
        [new AmpFile(files, 'streamable')] :
        files.map(file=> new AmpFile(file));
  }

  /**
   * Run appropriate file optimizations
   * @param {AmpFile[]} ampFiles
   * @private
   */
  _optimize(ampFiles) {
    ampFiles.forEach( ampFile => {
      typeZeroOptimizations.optimize(ampFile);

      if(this.options.optimizationLevel > 0) {
        typeOneOptimizations.optimize(ampFile)
      }
      if(this.options.optimizationLevel > 1) {
        typeTwoOptimizations.optimize(ampFile)
      }
      if (this.options.minify) FinalOptimizer.minify(ampFile);
      if (this.options.compress) FinalOptimizer.compress(ampFile);
    }, this)
  }

  /**
   * Does any post processing necessary to prepare packages for final handling
   * @param {AmpFile[]} ampFiles
   * @return {AmpFile[] | {
   *   reporting: object,
   *   optimizedHtmlString: string
   * }}
   * @private
   */
  _tearDown(ampFiles) {
    // Reconstruct files based off final state
    ampFiles.forEach(file => file.prepData());

    // Bundle result files into output location
    if(this.options.streamable){
      return {
        optimizedHtmlString: ampFiles[0].returnOptimizedHtml(),
        reporting: ampFiles[0].stats()
      }
    } else {
      ampFiles.forEach(file => {
        file.writeData(this.options.outputDir, this.options.fileNameDecorator);
      }, this);
      return ampFiles
    }
    // 3. Print necessary info to console
  }
}

module.exports = function(files, options, callback) {
  return new UnCss(files, options, callback);
};