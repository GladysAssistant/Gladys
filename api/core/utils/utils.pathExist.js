var fs = require('fs');

/**
 * Return if file/folder exist or not
 */
module.exports = function filePathExists(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err && err.code === 'ENOENT') {
        return resolve(false);
      } else if (err) {
        return reject(err);
      }
      if (stats.isFile() || stats.isDirectory()) {
        return resolve(true);
      }
    });
  });
};