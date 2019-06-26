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

module.exports = {
  exec,
};
