/**
 * @file Main entry point for UnCSS plugin.
 * @version 0.1
 */

import TypeZeroOptimizer from './TypeZeroOptimizer';
import TypeOneOptimizer from './TypeOneOptimizer';
import TypeTwoOptimizer from './TypeTwoOptimizer';
import FinalOptimizer from './FinalOps'
import AmpFile from './AmpFile'

class UnCSS {

  /**
   * @param {Object} config - An object containing configuration settings
   * @param {number} [config.optimizationLevel = 0] - Define how much processing should be done. Correlates with TypeOps classes used.
   * @param {string[]} config.inputFiles - Array of filenames to be optimized
   * @param {string} config.outputDir - Name of directory where files will be output
   * @param {boolean} [config.minify = false] - Implements FinalOps.minify on inputs
   * @param {boolean} [config.compress = false] - Implements FinalOps.compress on inputs.
   * @param {function} config.getHTMLFunc - Function used to get HTML source code. Provided by the entry point (Webpack or Chrome Ext).
   * @param {string[]} config.files - List of all files or directories to process.
   */
  constructor({
    optimizationLevel = 0,
    inputFiles,
    outputDir,
    minify = false,
    compress = false,
    getHTMLFunc,
    files
  })
  {

    this.optimizationLevel = optimizationLevel;
    this.inputFiles = inputFiles;
    this.outputDir = outputDir;
    this.minify = minify;
    this.compress = compress;
    this.getHTMLFunc = getHTMLFunc;
    this.files = files;
  }

  /**
   * Instantiates any necessary class instances with proper configurations
   */
  setup() {
    // 1. Iterate through all input files and instantiate an AmpFile for each page
    /** @description An array of key value pairs {fileName: AmpFile}*/
    this.fileReps = this.files.map((file, index)=> {
      var ampFile = new AmpFile(file);
      return {file: ampFile};
    })
  }


  /**
   * Executes all optimizations set up in this.setup() method
   */
  run() {
     // 1. Kickoff task queue
    this.fileReps.forEach(({fileName, ampFile}, index) => {
      TypeZeroOpimizer.optimize(ampFile)
      if(this.optimizationLevel > 0) {
        TypeOneOptimizer.optimize(ampFile)
      }
      if(this.optimizationLevel > 1) {
        TypeTwoOptimizer.optimize(ampFile)
      }
    })
     // 2. Collect relevant data for reporting
     //    a) % opt / file
     //    b) % opt total
     //    c) # of optimized files
     //    d) output of used CSS
     //    e) output of unused CSS
  }


  /**
   * Does any post processing necessary to prepare packages for final handling
   */
  tearDown() {
    // 1. Reconstruct files based off final state
    // 2. Bundle result files into output location
    // 3. Print necessary info to console
  }


  /**
   * Builds a set of all element tags used in HTML document. Used to determine
   *    whether or not certain optimizations can be made since certain AMP
   *    elements generate elements dynamically and may be broken if associated
   *    CSS is removed prematurely
   * @param {string} filepath - Location of file for which to curate an
   *    element set.
   * @returns {Object} Set of strings of all element tags used.
   */
  curateElementSet(filepath){}


  /**
   * Builds a set of all class names used in HTML elements on document. For use
   *    with optimization functions to determine if a CSS definition can be used
   * @param {string} filepath - Location of file for which to curate an
   *    element set.
   * @returns {Object} Set of strings of all class names used in HTML elements.
   */
  curateClassSet(filepath){}



}