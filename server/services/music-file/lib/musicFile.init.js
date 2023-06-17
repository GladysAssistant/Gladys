const fs = require('fs');
const path = require('path');
const { MUSIC } = require('../../../utils/constants');

/**
 * @description Read folder in local hard disk and list all music m3u file and fix list in MusicFileHandler.
 * @param {string} folderPath - Folder path to read.
 * @param {boolean} subFolder - Flag to inform is a subfolder read.
 * @example
 * init();
 */
function init(folderPath, subFolder) {
  let folderPathToUse = this.defaultFolder;
  if (folderPath) {
    folderPathToUse = folderPath;
  }
  if (!subFolder) {
    this.playlistFiles = [];
  }

  if (folderPathToUse && fs.existsSync(folderPathToUse)) {
    fs.readdirSync(folderPathToUse).forEach((file) => {
      const filePath = `${folderPathToUse}/${file}`;
      if (this.readSubDirectory === MUSIC.PROVIDER.STATUS.ENABLED && fs.statSync(filePath).isDirectory()) {
        this.init(filePath, true);
      } else if (path.extname(file).toLowerCase() === '.m3u') {
        this.playlistFiles.push({ label: path.parse(file).name, value: file, path: filePath });
      }
    });
  }
}

module.exports = {
  init,
};
