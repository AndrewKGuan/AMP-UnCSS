# AMP UnCSS ⚡

AMP-UnCSS is a way to tree-shake unused CSS from complete AMP HTML documents. It is our attempt at alleviating the work required to manually clean up CSS styles in order to meet the AMP HTML 50KB CSS limit.

## Installation Instructions

#### For use with Webpack

1. Install via NPM

``$ npm install --save amp-uncss``

2. Configure Webpack to include AMP-UnCSS plugin

#### Chrome Extension

## Documentation

Documentation can be found on the [official site](index.html). 

## License

AMP-UnCSS is licensed under the [Apache License, Version 2.0](LICENSE).

## Assumptions

- All input files are AMPed .html files
- Input files include exactly (2) `<style amp-boilerplate>` elements. Any additional `<style>` 
  elements will be consolidated into a single, optimized, `<style amp-custom>` element. 
- HTML Parsing: Due to the dynamic nature of certain AMP components such as`<amm-image>` and 
`<amp-livelist>`, a virtual browser will need to be instantiated to guarantee correct optimizations.
  - Type 0 and Type 1 optimizations operate with a simple static DOM parser
  - Type 2 optimizations will require a full browser instance (via Puppeteer) and will require 100x 
  the amount of time to complete.
