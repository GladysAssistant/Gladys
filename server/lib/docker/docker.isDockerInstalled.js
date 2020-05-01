const fs = require('fs');
const sys = require('sys');
const { exec } = require('child_process');
/**
 * @description Return true if process is running inside Docker
 * @returns {Promise<boolean>} Resolve with true if inside Docker.
 * @example
 * isDocker();
 */
function isDockerInstalled() {
  return new Promise((resolve) => {
    fs.access('/.dockerenv', fs.constants.F_OK, (err) => {
      if (err) {
        if (exec("test -x '$(command -v docker)'")) {
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  isDockerInstalled,
};
