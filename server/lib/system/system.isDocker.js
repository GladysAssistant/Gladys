const fs = require('fs');

/**
 * @description Return true if process is running inside Docker.
 * @returns {Promise<boolean>} Resolve with true if inside Docker.
 * @example
 * isDocker();
 */
function isDocker() {
  return new Promise((resolve) => {
    fs.access('/.dockerenv', fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  isDocker,
};
