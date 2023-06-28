const fs = require('fs/promises');

/**
 * @description Init all Android TV remote.
 * @example
 * init()
 */
async function init() {
  const dockerBased = await this.gladys.system.isDocker();
  if (dockerBased) {
    const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();
    this.basePathAndroidTV = `${basePathOnContainer}/android-tv`;
  } else {
    this.basePathAndroidTV = './services/android-tv/persist';
  }

  await fs.mkdir(this.basePathAndroidTV, { recursive: true });

  const devices = await this.gladys.device.get({
    service: 'android-tv',
  });
  await Promise.all(devices.map(device => this.buildTV(device)));
}

module.exports = {
  init,
};
