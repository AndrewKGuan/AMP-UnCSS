#!/usr/bin/env node
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


const ampUncss = require('./lib/main/amp-uncss');
const program = require('commander');
const fs = require('fs');

program
    .version('0.1.0', '-v, --version')
    .arguments('<directory>')
    .option('-R, --recursive',
        'Searches given directory recursively for HTML files.')
    .option('-l, --optimization-level <optimization-level>',
        'The optimization level to execute. Defaults to 0.', parseInt)
    .option('-t, --target-directory <target-directory>',
        'Specify the target directory. Defaults to \'./dist\'')
    .option('-f, --file-name-decorator <file-name-decorator>',
        'Specify the naming modification to each file - i.e. ' +
        '\'filename+mod.html.')
    .option('-r, --report',
        'Outputs an optimization report')
    .option('-d, --report-directory <report-directory>',
        'Specify the target directory for the optimization report.' +
         ' Will default to \'./reports\'')
    .option('-n, --report-name <report-name>',
        'Name of optimization report. Defaults to \'amp_unCss_report.json\'.')
    .option('-g, --report-granularity <report-granularity>',
        'Describes how detailed the report is. Defaults to \'small\'. Note: granular report files can become too large to parse with most IDEs')
    .option('-s, --specific',
        'specifies that given location is a file rather than dictionary')
    .action(async function(directory) {
      const options = {
        directory,
        recursive: program.recursive,
        optimizationLevel: program.optimizationLevel,
        targetDirectory: program.targetDirectory,
        filenameDecorator: program.fileNameDecorator,
        report:
            !!program.report ||
            !!program.reportDirectory ||
            !!program.reportName,
        reportDirectory: program.reportDirectory,
        reportName: program.reportName,
        specific: program.specific,
        reportSize: program.reportGranularity,
      };

      if (options.optimizationLevel &&
          !(options.optimizationLevel >= 0 && options.optimizationLevel <= 2)) {
        throw new RangeError(
            '<optimization-level> must be 0, 1, or 2. Default value is 0.');
      }

      const fileList = [];
      if (options.specific) {
        fileList.push(options.directory);
      } else {
        (function dig(dir) {
          fs.readdirSync(dir, {withFileTypes: true}).forEach((dirent) => {
            if (dirent.isFile()) {
              if (dirent.name.split('.').pop() === 'html') {
                fileList.push(dir + '/' + dirent.name);
              }
            } else if (dirent.isDirectory()) {
              if (options.recursive) {
                dig(dir + '/' + dirent.name);
              }
            }
          });
        })(options.directory);
      }

      const opts = Object.keys(options).reduce((acc, key) => {
        if (options[key]) acc[key] = options[key];
        return acc;
      }, {});
      await ampUncss(fileList, opts)
          .init()
          .then((uc) => {
            uc.run()
                .then((res) => {
                  console.log('Files processed without failure: ' + res.filter(af => af._stats.status.complete).length);
                  console.log('Files processed with warning: ' + res.filter(af => af._stats.status.complete && af._stats.status.warnings ).length);
                  console.log('Files failed during process: ' + res.filter(af => af._stats.status.failed).length);
                  uc.end()
                      .then((data) => {
                        console.log('Process completed successfully.');
                        return data;
                      })
                      .catch((err) => {
                        console.log('Error closing browser.');
                        throw err;
                      });
                })
                .catch((err) => {
                  console.log('Error running uncss within CLI context.');
                  throw err;
                });
          })
          .catch((err) => {
            console.log('Error occurred while executing UnCss.init()');
            throw err;
          });
    })
    .parse(process.argv);

