const { exec } = require('../../utils/childProcess');
const logger = require('../../utils/logger');

/**
 * @description Return free && used disk space.
 * @returns {Promise} Resolve with disk spaces infos or null.
 * @example
 * getDiskSpace();
 */
async function getDiskSpace() {
  try {
    const dfCommandStdout = await exec('df -kP');

    const allMountpoints = dfCommandStdout
      .trim()
      .split('\n')
      .slice(1)
      .map((line) => {
        const cl = line.split(/\s+(?=[\d/])/);

        return {
          filesystem: cl[0],
          size: parseInt(cl[1], 10) * 1024,
          used: parseInt(cl[2], 10) * 1024,
          available: parseInt(cl[3], 10) * 1024,
          capacity: parseInt(cl[4], 10) / 100,
          mountpoint: cl[5],
        };
      });
    return allMountpoints.filter((line) => line.mountpoint === '/')[0];
  } catch (e) {
    logger.debug('Unable to get disk space usage. This command only works on unix system with df installed.');
    logger.debug(e);
    return null;
  }
}

module.exports = {
  getDiskSpace,
};
