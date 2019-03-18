const assert = require('assert');
const fs = require('fs');
const AmpFile = require('../lib/main/AmpFile');
const testFilePath = 'tests/selectors';
const cmd = require('./cli_utils/cmd.js');

const processPath = 'index.js';

describe('AMP UnCSS CLI', function() {
  beforeEach(done=> {
    // Delete UnCss artifacts before each test
    if(fs.existsSync('output')) deleteRecursive('output');
    if(fs.existsSync('reports')) deleteRecursive('reports');
    if(fs.existsSync('dist')) deleteRecursive('dist');
    if(fs.existsSync('reports_dir')) deleteRecursive('reports_dir');

    done()
  });

  after(done => {
    // Delete UnCss artifacts after test block
    if(fs.existsSync('output')) deleteRecursive('output');
    if(fs.existsSync('reports')) deleteRecursive('reports');
    if(fs.existsSync('dist')) deleteRecursive('dist');
    if(fs.existsSync('reports_dir')) deleteRecursive('reports_dir');

    done()
  });


  it('should not create new report without prompting', async function() {
    await cmd(processPath,[testFilePath]);
    assert.ok(!fs.existsSync('reports'));
  });


  it('should create new report with report flag', async function() {
    await cmd(processPath,[testFilePath, '-r']);
    assert.ok(fs.existsSync('reports'));
    assert.ok(fs.existsSync('reports/amp_uncss_report.json'));
  });


  it('should create new report with report-name flag', async function() {
    await cmd(processPath,[testFilePath, '-n', 'reports_file', '-r']);
    assert.ok(fs.existsSync('reports'));
    assert.ok(fs.existsSync('reports/reports_file.json'));
  });


  it('should create new report with report-directory flag', async function() {
    await cmd(processPath,[testFilePath, 'r','-d','reports_dir']);
    assert.ok(fs.existsSync('reports_dir'));
    assert.ok(fs.existsSync('reports_dir/amp_uncss_report.json'));
  });


  it('should append existing report', async function() {
    await cmd(processPath,[testFilePath, '-r','-d','reports']);
    await cmd(processPath,[testFilePath, '-r','-d','reports']);
    const report = JSON.parse(fs.readFileSync('reports/amp_uncss_report.json','utf-8'));
    assert.ok(report.tests.length === 2);
  });

  it('should have correct report name', async function() {
    await cmd(processPath, [testFilePath, '-r','reports']);
    assert.ok(fs.existsSync('reports/amp_uncss_report.json'));
    await cmd(processPath,[testFilePath, '-r','reports', '-n','amp-report']);
    assert.ok(fs.existsSync('reports/amp-report.json'));
  });

  it('should not search for files recursively', async function() {
    await cmd(processPath,[testFilePath, '-r']);
    const report = JSON.parse(
        fs.readFileSync('reports/amp_uncss_report.json','utf-8'));

    assert.strictEqual(report.tests.length, 1);
    assert.strictEqual(report.tests[0].files.length,1);
  });

  it('should search for files recursively', async function() {
    await cmd(processPath,[testFilePath, '-r', '-R']);
    const report = JSON.parse(
        fs.readFileSync('reports/amp_uncss_report.json','utf-8'));

    assert.strictEqual(report.tests.length,1);
    assert.strictEqual(report.tests[0].files.length, 7);
  });

  it('should respond to defined optimization level', async function() {
    await cmd(processPath,[testFilePath, '-r']);
    await cmd(processPath,[testFilePath, '-r', '-l','1']);
    await cmd(processPath,[testFilePath, '-r', '-l','2']);
    const report = JSON.parse(fs.readFileSync('reports/amp_uncss_report.json','utf-8'));
    assert.ok(report.tests.length === 3 && report.tests[0].options.optimizationLevel === 0);
    assert.ok(report.tests.length === 3 && report.tests[1].options.optimizationLevel === 1);
    assert.ok(report.tests.length === 3 && report.tests[2].options.optimizationLevel === 2);
  });

  it('should error on incorrect optimization level', async function() {
    const msg = await assertThrowsAsynchronously();
    // Have to utilize includes() rather than testing msg.error because cmd()
    // function returns a String type, not an Error type due to the underlying
    // child_process mechanism.
    assert.ok(msg.includes("<optimization-level> must be 0, 1, or 2. Default value is 0."));
  });

  it('should output to the correct directory', async function() {
    await cmd(processPath,[testFilePath, '-t','output']);
    assert.ok(fs.existsSync('output'));
  });

  it('should output correct file names', async function() {
    const filenameDecorator = '_shook';
    await cmd(processPath, [testFilePath, '-r','-f', filenameDecorator]);

    fs.readdirSync('dist/', {withFileTypes: true}).forEach(dirent => {
      if(dirent.isFile()) {
        assert.ok(dirent.name.includes(filenameDecorator));
      }
    });
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
function assertThrowsAsynchronously() {
  return cmd(processPath,[testFilePath, '-l','3'])
      .then(d => d)
      .catch(e => e);
}
