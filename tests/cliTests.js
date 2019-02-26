const assert = require('assert');
const fs = require('fs');
const AmpFile = require('../lib/main/AmpFile');
const testFilePath = 'tests/selectors';
const cmd = require('./cli_utils/cmd.js');

const processPath = 'index.js';

describe('AMP UnCSS CLI', function() {
  beforeEach(done=> {
    if(fs.existsSync('output')) deleteRecursive('output');
    if(fs.existsSync('reports')) deleteRecursive('reports');
    if(fs.existsSync('dist')) deleteRecursive('dist');
    if(fs.existsSync('reports_dir')) deleteRecursive('reports_dir');

    done()
  });


  it('should not create new report without prompting', async function() {
    const response = await cmd(processPath,
        [testFilePath]);
    assert.ok(!fs.existsSync('reports'));
  });

  it('should create new report with report flag', async function() {
    const response = await cmd(processPath,
        [testFilePath, '-r']);
    assert.ok(fs.existsSync('reports'));
    assert.ok(fs.existsSync('reports/amp_uncss_report.json'));
  });

  it('should create new report with report-name flag', async function() {
    const response = await cmd(processPath,
        [testFilePath, '-n', 'reports_file', '-r']);
    assert.ok(fs.existsSync('reports'));
    assert.ok(fs.existsSync('reports/reports_file.json'));
  });

  it('should create new report with report-directory flag', async function() {
    const response = await cmd(processPath,
        [testFilePath, 'r','-d','reports_dir']);
    assert.ok(fs.existsSync('reports_dir'));
    assert.ok(fs.existsSync('reports_dir/amp_uncss_report.json'));
  });

  it('should append existing report', async function() {
    const response0 = await cmd(processPath,[testFilePath, '-r','-d','reports']),
          response1 = await cmd(processPath,[testFilePath, '-r','-d','reports']);
    const report = JSON.parse(fs.readFileSync('reports/amp_uncss_report.json','utf-8'));
    assert.ok(report.tests.length === 2);
  });
  it('should have correct report name', async function() {
    const response0 = await cmd(processPath, [testFilePath, '-r','reports']);
    assert.ok(fs.existsSync('reports/amp_uncss_report.json'));
    const response1 = await cmd(processPath,
        [testFilePath, '-r','reports', '-n','amp-report']);
    assert.ok(fs.existsSync('reports/amp-report.json'));
  });
  it('should not search for files recursively', async function() {
    const response = await cmd(processPath,[testFilePath, '-r']);
    const report = JSON.parse(
        fs.readFileSync('reports/amp_uncss_report.json','utf-8'));

    assert.strictEqual(report.tests.length, 1);
    assert.strictEqual(report.tests[0].files.length,1);
  });
  it('should search for files recursively', async function() {
    const response = await cmd(processPath,[testFilePath, '-r', '-R']);
    const report = JSON.parse(
        fs.readFileSync('reports/amp_uncss_report.json','utf-8'));

    assert.strictEqual(report.tests.length,1);
    assert.strictEqual(report.tests[0].files.length, 5);
  });
  it('should respond to defined optimization level', async function() {
    const response0 = await cmd(processPath,[testFilePath, '-r']),
          response1 = await cmd(processPath,[testFilePath, '-r', '-l','1']),
          response2 = await cmd(processPath,[testFilePath, '-r', '-l','2']);
    const report = JSON.parse(fs.readFileSync('reports/amp_uncss_report.json','utf-8'));
    assert.ok(report.tests.length === 3 && report.tests[0].options.optimizationLevel === 0);
    assert.ok(report.tests.length === 3 && report.tests[1].options.optimizationLevel === 1);
    assert.ok(report.tests.length === 3 && report.tests[2].options.optimizationLevel === 2);
  });
  it('should error on incorrect optimization level', async function() {
    const response = await cmd(processPath,[testFilePath, '-l','3']);
    console.log(response)
    assert.strictEqual(response, "<optimization-level> must be 0, 1, or 2. Default value is 2.");
  });
  it('should output to the correct directory', async function() {
    const response = await cmd(processPath,[testFilePath, '-t','output']);
    assert.ok(fs.existsSync('output'));
  });
  it('should output correct file names', async function() {
    const response = await cmd(processPath,
        [testFilePath, '-r','-m','_shook']);
    const report = JSON.parse(fs.readFileSync('reports/amp_uncss_report.json','utf-8'));
    assert.ok(report.tests[0].files.every(d => {
      return d.fileName.includes('_shook.html')
    }));
  });
});

function deleteRecursive(path) {
  if(fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      let currPath = path + '/' + file;
      if(fs.lstatSync(currPath).isDirectory()) {
        deleteRecursive(currPath);
      } else {
        fs.unlinkSync(currPath)
      }
    });
    fs.rmdirSync(path);
  }
}