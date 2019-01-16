# AMP UnCSS ⚡

AMP-UnCSS is a way to tree-shake unused CSS from complete AMP HTML documents. It is an attempt at 
alleviating the work required to manually clean up CSS styles in order to meet the AMP HTML 50 kB CSS limit.


## Installation
     $ npm install amp-uncss
## Usage

### Within Node.js:

```js
var ampUncss = require('amp-unCss');

var files = ["my", "array", "of", "html", "files"],
    options = {
      streamable            : false,
      optimizationLevel     : 1,
      targetDirectory       : "./dist", 
      reportDirectory       : "./reports",
      reportName            : "amp_uncss_report.json",
      modifier              : "amp_opt",      
    };

/** Invoked with no options */
ampUncss(files);

/** With options */
ampUncss(files, options);
```

### At build-time
AMP UnCSS can also be used in conjunction with other Javascript build systems including Gulp.
* [gulp-amp-uncss](index.html)

### From the command line:

AMP UnCSS can be used directly from the command line.

``` 
 Usage: amp-uncss [options] <directory>
     e.g amp-uncss -R -l 1 ./source/html
 
Options:
  -v, --version                                  output the version number
  -R, --recursive                                Searches given directory recursively for HTML files.
  -l, --optimization-level <optimization-level>  The optimization level to execute. 
  -t, --target-directory <target-directory>      Specify the target directory. Defaults to './dist'
  -r, --report-directory <report-directory>      Specify the target directory for the optimization report. Will default to './reports'
  -n, --report-name <report-name>                Name of optimization report. Defaults to 'amp_unCss_report'.
  -m, --report-modifier <report-modifier>        Specify the naming modification to each file - i.e. 'filename+mod.html.
  -h, --help                                     output usage information
```

#### Options

* __recursive__ : Searches given directory recursively for HTML files.

* __optimizationLevel__ (Number): Optimization level determines the maximum rendering of the virtual DOM during CSS tree-shaking.
  * 0 (default): non-dynamic DOM parsing. Will not render dynamic AMP element tags such as `<amp-list>` or `<amp-image>`.
  * 1: Dynamic DOM-parsing using Puppeteer. May slow down processing significantly for large file sets.
   * 2: Extra optimizations including maximum specificity.

* __targetDirectory__ (String): The name of the directory optimized files will write to. Defaults to `./dist`.

* __reportDirectory__ (String): The name of the directory optimization report will write to. Defaults to `./reports`.

* __reportName__ (String): The name of optimization report. Defaults to `amp_uncss_report`.

* __reportModifier__ (String): The modifier appended to input file names when written to target directory. E.g. `optimized` === `inputFile_optimized.html`.
 
 NOTE: If AMP UnCSS is run with reportDirectory containing `reportName.json`, all test data will be appended to existing report.  

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

## Git Workflow

Note: Local repo contains 'master' and working branches. Origin repo contains 'master', 'dev', 'KES_dev', & 'AKG_dev'

1. ``master: git pull --rebase origin dev``
2. ``master: git checkout -b <working-branch-name>``
3. Do work and testing here.
4. ``<working-branch-name>: git add (. / file-names)``
5. ``<working-branch-name>: git commit -m "<commit message>``
6. ``<working-branch-name: git checkout master``
7. ``master: git pull --rebase upstream dev``
8. Fix merge conflicts.
9. Commit merge conflicts.
10. ``master: git push origin <AKG||KES>_dev``
11. Create merge request from ``<AKG||KES>_dev`` to ``dev``. Assign other contributer to review merge.  
