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

    const args = ['-i', cameraUrlParam.value, '-f', 'image2', '-vframes', '1', '-qscale:v', '15'];

    args.push('-vf');
    switch (cameraRotationParam.value) {
      case DEVICE_ROTATION.DEGREES_90:
        args.push('scale=640:-1,transpose=1'); // Rotate 90
        break;
      case DEVICE_ROTATION.DEGREES_180:
        args.push('scale=640:-1,transpose=1,transpose=1'); // Rotate 180
        break;
      case DEVICE_ROTATION.DEGREES_270:
        args.push('scale=640:-1,transpose=2'); // Rotate 270
        break;
      default:
        args.push('scale=640:-1'); // Rotate 0
        break;
    }

    // add destination file path
    args.push(filePath);

    logger.debug(`Getting camera image on URL ${cameraUrlParam.value}`);
    this.childProcess.execFile(
      'ffmpeg',
      args,
      {
        timeout: 10 * 1000, // 10 second max
      },
      async (error, stdout, stderr) => {
        if (error) {
          logger.warn(error);
          await fse.remove(filePath);
          return reject(error);
        }
        logger.debug('Camera image saved to disk. Reading disk.');
        let image;
        try {
          image = await fse.readFile(filePath);
        } catch (e) {
          await fse.remove(filePath);
          return reject(e);
        }
        logger.debug('Camera image read from disk, converting to base64');

        // convert binary data to base64 encoded string
        const cameraImageBase = Buffer.from(image).toString('base64');
        const cameraImage = `image/jpg;base64,${cameraImageBase}`;
        logger.debug('Camera converted to base64, resolving.');
        resolve(cameraImage);
        await fse.remove(filePath);
        return null;
      },
    );
  });
}

module.exports = {
  getImage,
};
