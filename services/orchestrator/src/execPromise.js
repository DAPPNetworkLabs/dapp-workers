const { exec } = require('child_process');

function onData(printCB, printStream, outObj, key) {
  return function(data) {
    var line = data.toString();
    if (printCB) { line = printCB(line); }
    if (printStream) { printStream.write(line); }
    outObj[key] += line;
  };
}
export const execPromise = function(cmd, options) {
  return new Promise(function(resolve, reject) {
    if (options && options.unref) {
      options.detached = true;
      options.stdio = ['ignore'];
    }
    var childproc = exec(cmd, options, function(err, stdout) {
        console.log(`err: ${err}`);
        console.log(`stdout: ${stdout}`);
    });
    options = options || {};
    var { printOutStream, printErrStream, printOutCB, printErrCB } = options;
    if (options.unref) {
      childproc.unref();
      return resolve('');
    }
    const outObj = {
      stdout: '',
      stderr: ''
    };
    childproc.stdout.on('data', onData(printOutCB, printOutStream, outObj, 'stdout'));
    childproc.stderr.on('data', onData(printErrCB, printErrStream, outObj, 'stderr'));
    childproc.on('exit', function(code) {
      var stdout = outObj.stdout;
      if (code === 0) { return resolve(stdout); }
      var err = new Error('exec failed');
      err.stdout = stdout;
      err.stderr = outObj.stderr;
      err.code = code;
      return reject(err);
    });
  });
};