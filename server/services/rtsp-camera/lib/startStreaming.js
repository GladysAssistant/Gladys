const fse = require('fs-extra');
const Promise = require('bluebird');
const { promises: fs } = require('fs');
const path = require('path');
const util = require('util');
const randomBytes = util.promisify(require('crypto').randomBytes);
const { spawn } = require('child_process');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

const DEVICE_PARAM_CAMERA_URL = 'CAMERA_URL';
const DEVICE_PARAM_CAMERA_ROTATION = 'CAMERA_ROTATION';

const waitBeforeExist = async (filePath, delay, maxTryLeft) => {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return null;
  } catch (e) {
    if (maxTryLeft > 0) {
      const newMaxTryLeft = maxTryLeft - 1;
      await Promise.delay(delay);
      return waitBeforeExist(filePath, delay, newMaxTryLeft);
    }
    throw new Error('Max try reached, file does not exist');
  }
};

/**
 * @description Start streaming
 * @param {Object} cameraSelector - The camera to stream.
 * @param {string} backendUrl - URL of the backend
 * @returns {Promise} Resolve when stream started.
 * @example
 * startStreaming(device);
 */
async function startStreaming(cameraSelector, backendUrl) {
  const device = await this.gladys.device.getBySelector(cameraSelector);
  // we find the camera url in the device
  const cameraUrlParam = device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_URL);
  if (!cameraUrlParam) {
    throw new NotFoundError('CAMERA_URL_PARAM_NOT_FOUND');
  }
  if (!cameraUrlParam.value || cameraUrlParam.value.length === 0) {
    throw new NotFoundError('CAMERA_URL_SHOULD_NOT_BE_EMPTY');
  }
  // we find the camera rotation in the device
  let cameraRotationParam = device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_ROTATION);
  if (!cameraRotationParam) {
    cameraRotationParam = '0';
  }
  // we create a temp folder
  const now = new Date();
  const cameraFolder = `camera-${device.id}-${now.getSeconds()}-${now.getMinutes()}-${now.getHours()}`;
  const folderPath = path.join(this.gladys.config.tempFolder, cameraFolder);
  await fse.ensureDir(folderPath);
  const indexFilePath = path.join(folderPath, 'index.m3u8');
  // We create an encryption key
  const encryptionKey = (await randomBytes(16)).toString('hex');
  const encryptionKeyUrl = `${backendUrl}/api/v1/service/rtsp-camera/camera/streaming/${cameraFolder}/index.m3u8.key`;
  const keyInfoFilePath = path.join(folderPath, 'key_info_file.txt');
  const encryptionKeyFilePath = path.join(folderPath, 'index.m3u8.key');
  await fs.writeFile(keyInfoFilePath, `${encryptionKeyUrl}\n${encryptionKeyFilePath}`);
  await fs.writeFile(encryptionKeyFilePath, encryptionKey);
  // Build the array of parameters
  const args = [
    '-i',
    cameraUrlParam.value,
    '-c:v',
    'h264',
    '-preset',
    'veryfast',
    '-flags',
    '+cgop',
    '-g',
    '25',
    '-hls_time',
    '1',
    '-hls_list_size',
    '10',
    '-hls_enc',
    '1',
    '-hls_enc_key',
    encryptionKey,
    '-hls_key_info_file',
    keyInfoFilePath,
    indexFilePath,
  ];

  if (cameraRotationParam.value === '1') {
    args.push('-vf hflip,vflip'); // Rotate 180
  }
  const options = {
    timeout: 10 * 60 * 1000, // 10 minutes
  };

  const liveStreamingProcess = spawn('ffmpeg', args, options);

  liveStreamingProcess.stdout.on('data', (data) => {
    logger.debug(`stdout: ${data}`);
  });

  liveStreamingProcess.stderr.on('data', (data) => {
    logger.warn(`stderr: ${data}`);
  });

  liveStreamingProcess.on('close', (code) => {
    logger.debug(`child process exited with code ${code}`);
    this.liveStreams.delete(cameraSelector);
  });

  this.liveStreams.set(cameraSelector, liveStreamingProcess);

  // Wait before the stream started to resolve
  // We'll wait at most 100 * 100 ms = 10 sec
  await waitBeforeExist(indexFilePath, 100, 100);

  return {
    camera_folder: cameraFolder,
    encryption_key: encryptionKey,
  };
}

module.exports = {
  startStreaming,
};
