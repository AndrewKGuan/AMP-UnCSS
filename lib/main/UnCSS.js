/**
 * @file Main entry point for UnCSS plugin.
 * @version 0.1
 */

import TierZeroOps from './TierZeroOps';
import TierOneOps from './TierOneOps';
import TierTwoOps from './TierTwoOps';
import FinalOps from './FinalOps'

class UnCSS {

  /**
   * @param {Object} config - An object containing configuration settings
   * @param {number} [config.optimizationLevel = 0] - Define how much processing should be done. Correlates with TierOps classes used.
   * @param {string[]} config.inputFiles - Array of filenames to be optimized
   * @param {sting} config.outputDir - Name of directory where files will be output
   * @param {boolean} [config.minify = false] - Implements FinalOps.minify on inputs
   * @param {boolean} [config.compress = false] - Implements FinalOps.compress on inputs.
   */
  constructor({optimizationLevel = 0, inputFiles, outputDir, minify = false, compress = false}){

    this.optimizationLevel = optimizationLevel;
    this.inputFiles = inputFiles;
    this.outputDir = outputDir;
    this.minify = minify;
    this.compress = compress;
  }

  /**
   *
   */
  setup() {

  }

  run() {

  }

  tearDown() {

  }

}