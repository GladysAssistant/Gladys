const fse = require('fs-extra');
const path = require('path');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
const { DEVICE_ROTATION } = require('../../../utils/constants');

const DEVICE_PARAM_CAMERA_URL = 'CAMERA_URL';
const DEVICE_PARAM_CAMERA_ROTATION = 'CAMERA_ROTATION';

/**
 * @description Get camera image.
 * @param {object} device - The camera to poll.
 * @returns {Promise} Resolve with camera image.
 * @example
 * getImage(device);
 */
async function getImage(device) {
  return new Promise((resolve, reject) => {
    // we find the camera url in the device
    const cameraUrlParam = device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_URL);
    if (!cameraUrlParam) {
      reject(new NotFoundError('CAMERA_URL_PARAM_NOT_FOUND'));
      return;
    }
    if (!cameraUrlParam.value || cameraUrlParam.value.length === 0) {
      reject(new NotFoundError('CAMERA_URL_SHOULD_NOT_BE_EMPTY'));
      return;
    }
    // we find the camera rotation in the device
    let cameraRotationParam =
      device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_ROTATION);
    if (!cameraRotationParam) {
      cameraRotationParam = '0';
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
      '-qscale:v 15', //  Effective range for JPEG is 2-31 with 31 being the worst quality.
    ];
    switch (cameraRotationParam.value) {
      case DEVICE_ROTATION.DEGREES_90:
        outputOptions.push('-vf scale=640:-1,transpose=1'); // Rotate 90
        break;
      case DEVICE_ROTATION.DEGREES_180:
        outputOptions.push('-vf scale=640:-1,transpose=1,transpose=1'); // Rotate 180
        break;
      case DEVICE_ROTATION.DEGREES_270:
        outputOptions.push('-vf scale=640:-1,transpose=2'); // Rotate 270
        break;
      default:
        outputOptions.push('-vf scale=640:-1'); // Rotate 0
        break;
    }

    // Send a camera thumbnail to this stream
    // Add a timeout to prevent ffmpeg from running forever
    this.ffmpeg(cameraUrlParam.value, { timeout: 10 })
      .format('image2')
      .outputOptions(outputOptions)
      .output(writeStream)
      .on('end', async () => {
        let image;
        try {
          image = await fse.readFile(filePath);
        } catch (e) {
          reject(e);
          return;
        }

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
  });
}

module.exports = {
  getImage,
};
