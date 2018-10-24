/**
 * @file Wrapper to make UnCSS compatible with Webpack
 * @version 0.1
 */

/**
 *
 */
class UnCSSWebPackPlugin {

  /**
   * @param {Object} config - An object containing configuration setting
   */
  constructor({}){

  }

  /**
   * Get a list of filenames from WebPack compiler to pass into UnCSS
   *    Current assumption is that all files are amp.html pages that include all
   *    necessary style definitions.
   * @return {string[]} A list of filenames to be handled in UnCSS optimizer
   */
  getFilenames() {}

  /**
   * Apply is called once by the webpack compiler while installing
   *    the plugin. The apply method is given a reference to the underlying
   *    webpack compiler, which grants access to compiler callbacks.
   *
   * @param {Object} compiler - Reference to Webpack compiler
   */
  apply(compiler){}


}