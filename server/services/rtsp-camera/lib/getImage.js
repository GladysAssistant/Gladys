const fse = require('fs-extra');
const path = require('path');
const logger = require('../../../utils/logger');
const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');

const DEVICE_PARAM_CAMERA_URL = 'CAMERA_URL';
const DEVICE_PARAM_CAMERA_USERNAME = 'CAMERA_USERNAME';
const DEVICE_PARAM_CAMERA_PASSWORD = 'CAMERA_PASSWORD';

/**
 * @description Get camera image.
 * @param {Object} device - The camera to poll.
 * @returns {Promise} Resolve with camera image.
 * @example
 * getImage(device);
 */
async function getImage(device) {
  return new Promise(async (resolve, reject) => {
    // we find the camera url in the device
    const cameraUrlParam = device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_URL);
    if (!cameraUrlParam) {
      return reject(new NotFoundError('CAMERA_URL_PARAM_NOT_FOUND'));
    }
    if (!cameraUrlParam.value || cameraUrlParam.value.length === 0) {
      return reject(new NotFoundError('CAMERA_URL_SHOULD_NOT_BE_EMPTY'));
    }

    // build url
    let url;
    try {
      url = new URL(cameraUrlParam.value);

      const username = (device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_USERNAME) || {}).value;
      if (username) {
        url.username = username;

        const password = (device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_PASSWORD) || {}).value;
        url.password = password;
      }
    } catch (e) {
      return reject(new BadParameters('CAMERA_URL_IS_NOT_VALID'));
    }

    // we create a temp folder
    const now = new Date();
    const filePath = path.join(
      this.gladys.config.tempFolder,
      `camera-${device.id}-${now.getMilliseconds()}-${now.getSeconds()}-${now.getMinutes()}-${now.getHours()}.jpg`,
    );
    // we create a writestream
    const writeStream = fse.createWriteStream(filePath);

    // and send a camera thumbnail to this stream
    this.ffmpeg(url.href)
      .format('image2')
      .outputOptions('-vframes 1')
      // resize the image with max width = 640
      .outputOptions('-vf scale=640:-1')
      //  Effective range for JPEG is 2-31 with 31 being the worst quality.
      .outputOptions('-qscale:v 15')
      .output(writeStream)
      .on('end', async () => {
        const image = await fse.readFile(filePath);
        // convert binary data to base64 encoded string
        const cameraImageBase = Buffer.from(image).toString('base64');
        const cameraImage = `image/png;base64,${cameraImageBase}`;
        resolve(cameraImage);
        await fse.remove(filePath);
      })
      .on('error', async (err, stdout, stderr) => {
        logger.debug(`Cannot process video: ${err.message}`);
        logger.debug(stderr);
        reject(err.message);
        await fse.remove(filePath);
      })
      .run();
    return null;
  });
}

module.exports = {
  getImage,
};
