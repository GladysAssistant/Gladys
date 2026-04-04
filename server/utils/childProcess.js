const { promisify } = require('util');
const childProcess = require('child_process');
const logger = require('./logger');

const MAX_BUFFER_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * @description Execute a command and return results.
 * @param {string} command - The command to execute.
 * @returns {Promise} Resolve if command resolve.
 * @example
 * exec('ls');
 */
function exec(command) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { maxBuffer: MAX_BUFFER_SIZE }, (err, stdout, stderr) => {
      if (err) {
        logger.debug(`Exec: Fail to execute command ${command}`);
        logger.debug(err);
        logger.debug(stderr);
        return reject(err);
      }

      return resolve(stdout);
    });
  });
}

const execFileAsync = promisify(childProcess.execFile);

/**
 * @description Execute a file with arguments (no shell).
 * @param {string} file - The file to execute.
 * @param {Array<string>} args - The arguments to pass.
 * @returns {Promise<string>} Resolve with stdout if command succeeds.
 * @example
 * execFile('tar', ['-tzvf', 'file.tar.gz']);
 */
async function execFile(file, args) {
  try {
    const { stdout } = await execFileAsync(file, args, { maxBuffer: MAX_BUFFER_SIZE });
    return stdout;
  } catch (err) {
    logger.debug(`ExecFile: Fail to execute ${file} ${args.join(' ')}`);
    logger.debug(err);
    logger.debug(err.stderr);
    throw err;
  }
}

module.exports = {
  exec,
  execFile,
};
