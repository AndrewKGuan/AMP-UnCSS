#! /usr/bin/env node

const ampUncss = require("./lib/main/UnCss");
const program = require("commander");
const fs = require("fs")

program
  .version("0.1.0", "-v, --version")
  .arguments('<directory>')
  .option('-R, --recursive', "Searches given directory recursively for HTML files.")
  .option('-l, --optimization-level <optimization-level>',
      "The optimization level to execute. Defaults to 0.", parseInt)
  .option('-t, --target-directory <target-directory>',
      "Specify the target directory. Defaults to './dist'")
  .option('-f, --file-name-decorator <file-name-decorator>',
      "Specify the naming modification to each file - i.e. 'filename+mod.html.")
  .option('-r, --report',
      "Outputs an optimization report")
  .option('-d, --report-directory <report-directory>',
      "Specify the target directory for the optimization report. Will default to './reports'")
  .option('-n, --report-name <report-name>',
      "Name of optimization report. Defaults to 'amp_unCss_report.json'.")
  .option('-s, --specific',
      "specifies that given location is a file rather than dictionary")
  .action(function(directory) {
    const options = {
      directory,
      recursive: program.recursive,
      optimizationLevel: program.optimizationLevel,
      targetDirectory: program.targetDirectory,
      filenameDecorator: program.fileNameDecorator,
      report: !!program.report || !!program.reportDirectory || !!program.reportName,
      reportDirectory: program.reportDirectory,
      reportName: program.reportName,
      specific: program.specific
    };

    if(options.optimizationLevel && !(options.optimizationLevel >= 0 && options.optimizationLevel <= 2)) {
      throw RangeError("<optimization-level> must be 0, 1, or 2. Default value is 0.");
    }

    const fileList = [];
    if(options.specific) {
      fileList.push(options.directory)
    } else {
      (function dig(dir) {
        fs.readdirSync(dir, {withFileTypes: true}).forEach(dirent => {
            if(dirent.isFile()) {
              if(dirent.name.split('.')[1] === "html") {
                fileList.push(dir + "/" + dirent.name)
              }
            } else if (dirent.isDirectory()){
              if(options.recursive) {
                dig(dir + "/" + dirent.name)
              }
            }
        })
      })(options.directory);
    }

    const opts = Object.keys(options).reduce((acc, key) => {
      if(options[key]) acc[key] = options[key];
      return acc
    },{});
    ampUncss(fileList, opts)
  })
    .parse(process.argv);

