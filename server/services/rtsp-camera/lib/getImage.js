const fse = require('fs-extra');
const path = require('path');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

const DEVICE_PARAM_CAMERA_URL = 'CAMERA_URL';
const DEVICE_PARAM_CAMERA_ROTATION = 'CAMERA_ROTATION';

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
    // we find the camera rotation in the device
    const cameraRotationParam =
      device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_ROTATION);
    if (!cameraRotationParam) {
      return reject(new NotFoundError('CAMERA_ROTATION_PARAM_NOT_FOUND'));
    }
    // we create a temp folder
    const now = new Date();
    const filePath = path.join(
      this.gladys.config.tempFolder,
      `camera-${device.id}-${now.getMilliseconds()}-${now.getSeconds()}-${now.getMinutes()}-${now.getHours()}.jpg`,
    );
    // we create a writestream
    const writeStream = fse.createWriteStream(filePath);
    const outputOptions = [
      '-vframes 1',
      '-vf scale=640:-1', // resize the image with max width = 640
      '-qscale:v 15', //  Effective range for JPEG is 2-31 with 31 being the worst quality.
    ];
    if (cameraRotationParam.value === 'on') {
      outputOptions.push('-vf hflip,vflip'); // Rotate 180
    }
    // and send a camera thumbnail to this stream
    this.ffmpeg(cameraUrlParam.value)
      .format('image2')
      .outputOptions(outputOptions)
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
