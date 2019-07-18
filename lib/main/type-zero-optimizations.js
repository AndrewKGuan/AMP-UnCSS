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
 * @file Optimizer that handles basic CSS optimizations including:
 * Removal of all AMP-* selectors that don't have corresponding AMP elements,
 * Removal of all selectors that contain a tag not present in the DOM,
 * Removal of all selectors w/specific class names that don't occur on the page,
 * & removal of empty selectors,
 * @version 0.1
 */

const {performance} = require('perf_hooks');
const dropcss = require('dropcss');
const postcss = require('postcss');


/**
 * Controls all Type 0 Ops
 */
const typeZeroOptimizations = {
  /**
   * @description Executes all Type Zero optimizations
   * @param {AmpFile} ampFile
   * @return {AmpFile}
   */
  optimize: function(ampFile) {
    const html = ampFile.staticDom.getStubbedHtml();
    const rawCss = ampFile.parsedCss.toString();
    const whitelist = ampFile.selectorWhiteList || [];
    const newCss = dropcss({
      html,
      css: rawCss,
      shouldDrop: (sel) => {
        const flag = whitelist.some((selector) => {
          const regx = new RegExp(selector);
          return regx.test(sel);
        });
        if (flag) return false;
        if (whitelist.includes(sel)) return false;
        ampFile._stats.selectorsRemoved.push(sel);
        return true;
      },
    });
    ampFile.parsedCss = postcss.parse(newCss.css);
    ampFile.setStatus('optimized', performance.now());
    ampFile.setStatus('optLevel', 0);
    return ampFile;
  },
};

module.exports = typeZeroOptimizations;
