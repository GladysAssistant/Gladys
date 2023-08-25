const fse = require('fs-extra');
const Promise = require('bluebird');
const { promises: fs } = require('fs');
const fsWithoutPromise = require('fs');
const EvenEmitter = require('events');
const path = require('path');
const util = require('util');
const randomBytes = util.promisify(require('crypto').randomBytes);
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
const { DEVICE_ROTATION } = require('../../../utils/constants');

const DEVICE_PARAM_CAMERA_URL = 'CAMERA_URL';
const DEVICE_PARAM_CAMERA_ROTATION = 'CAMERA_ROTATION';

/**
 * @description Start streaming.
 * @param {string} cameraSelector - The camera to stream.
 * @param {boolean} isGladysGateway - If the stream starts from Gladys Gateway or local.
 * @param {number} segmentDuration - The duration of one segment in seconds.
 * @returns {Promise} Resolve when stream started.
 * @example
 * startStreaming(device);
 */
async function startStreaming(cameraSelector, isGladysGateway, segmentDuration = 1) {
  // If stream already exist, return existing stream
  if (this.liveStreams.has(cameraSelector)) {
    const liveStream = this.liveStreams.get(cameraSelector);
    // If we are in a local stream, and new request come from Gladys Plus
    if (liveStream.isGladysGateway === false && isGladysGateway === true) {
      await this.convertLocalStreamToGateway(cameraSelector);
    }
    return {
      camera_folder: liveStream.cameraFolder,
      encryption_key: liveStream.encryptionKey,
    };
  }
  // Init the stream object
  this.liveStreams.set(cameraSelector, {
    isGladysGateway,
  });

  try {
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
    let cameraRotationParam =
      device.params && device.params.find((param) => param.name === DEVICE_PARAM_CAMERA_ROTATION);
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
    // The "BACKEND_URL_TO_REPLACE" will be replaced by the client with his API URL.
    // On the Gateway side, it'll be replaced by the Gateway server url
    const encryptionKeyUrl = `BACKEND_URL_TO_REPLACE/api/v1/service/rtsp-camera/camera/streaming/${cameraFolder}/index.m3u8.key`;
    const keyInfoFilePath = path.join(folderPath, 'key_info_file.txt');
    const encryptionKeyFilePath = path.join(folderPath, 'index.m3u8.key');

    const streamingReadyEvent = new EvenEmitter();
    const watchAbortController = new AbortController();
    const sharedObjectToVerify = {};

    // We watch the folder to upload any change to Gladys Plus
    fsWithoutPromise.watch(
      folderPath,
      {
        signal: watchAbortController.signal,
      },
      (eventType, filename) => {
        logger.debug(`New camera file ${filename}`);
        // if it's the first time that the index file is seen
        // We throw an event to signify that index exist
        if (filename === 'index.m3u8' && !sharedObjectToVerify.indexExist) {
          sharedObjectToVerify.indexExist = true;
          streamingReadyEvent.emit('index-ready');
        }
        this.onNewCameraFile(
          cameraSelector,
          folderPath,
          cameraFolder,
          filename,
          sharedObjectToVerify,
          streamingReadyEvent,
        );
      },
    );

    await Promise.all([
      fs.writeFile(keyInfoFilePath, `${encryptionKeyUrl}\n${encryptionKeyFilePath}`),
      fs.writeFile(encryptionKeyFilePath, encryptionKey),
    ]);

    // Build the array of parameters
    const args = [
      '-i',
      cameraUrlParam.value,
      '-c:v',
      'h264', // Codec H264
      '-preset',
      'veryfast', // Encoding presets
      '-flags',
      '+cgop',
      '-r',
      '25', // Frames (rate) per second
      '-g',
      '25', // Set key frame placement. The GOP size sets the maximum distance between key frames;
      '-b:v',
      '1000k', // Bitrate
      '-maxrate',
      '1500k', // Maximum bitrate nevertheless of the quality factor crf
      '-bufsize',
      '3000k', // Based on the -bufsize option, ffmpeg will calculate and correct the average bit rate produced.
      // If we specify a smaller -bufsize, ffmpeg will more frequently check for the output bit rate
      // and constrain it to the specified average bit rate from the command line
      '-crf',
      '25', // Quality of the video Constant Rate Factor 17-18 visually lossless, 23 default, 0 lossless, 51 highest
      '-sc_threshold',
      '0', // Disable scene detection
      '-c:a',
      'aac', // Audio codec aac
      '-b:a',
      '128k', // Bitrate for the audio
      '-ac',
      '2', // Audio channels, 2 = stereo
      '-hls_time',
      segmentDuration.toString(),
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

    let cameraRotationArgs = '';
    switch (cameraRotationParam.value) {
      case DEVICE_ROTATION.DEGREES_90:
        cameraRotationArgs = 'scale=1920:-1,transpose=1'; // Full HD resolution & Rotate 90
        break;
      case DEVICE_ROTATION.DEGREES_180:
        cameraRotationArgs = 'scale=1920:-1,transpose=1,transpose=1'; // Full HD resolution & Rotate 180
        break;
      case DEVICE_ROTATION.DEGREES_270:
        cameraRotationArgs = 'scale=1920:-1,transpose=2'; // Full HD resolution & Rotate 270
        break;
      default:
        cameraRotationArgs = 'scale=1920:-1'; // Full HD resolution & Rotate 0
        break;
    }

    args.splice(8, 0, '-vf', cameraRotationArgs);

    const options = {
      timeout: 5 * 60 * 1000, // 5 minutes
    };

    const liveStreamingProcess = this.childProcess.spawn('ffmpeg', args, options);

    this.liveStreams.set(cameraSelector, {
      liveStreamingProcess,
      cameraFolder,
      encryptionKey,
      watchAbortController,
      fullFolderPath: folderPath,
      isGladysGateway,
    });

    liveStreamingProcess.stdout.on('data', (data) => {
      logger.debug(`stdout: ${data}`);
    });

    liveStreamingProcess.stderr.on('data', (data) => {
      logger.debug(`stderr: ${data}`);
    });

    liveStreamingProcess.on('close', (code) => {
      logger.debug(`child process exited with code ${code}`);
      streamingReadyEvent.emit('init-error', new Error(`Child process exited with code ${code}`));
      this.stopStreaming(cameraSelector);
    });

    // Every X seconds, we verify if the live is active
    // If not, we stop the live to avoid wasting ressources
    if (!this.checkIfLiveActiveInterval) {
      this.checkIfLiveActiveInterval = setInterval(
        this.checkIfLiveActive.bind(this),
        this.checkIfLiveActiveFrequencyInSeconds * 1000,
      );
    }

    return new Promise((resolve, reject) => {
      let alreadyResolved = false;
      streamingReadyEvent.on('index-ready', () => {
        if (!isGladysGateway && !alreadyResolved) {
          alreadyResolved = true;
          resolve({
            camera_folder: cameraFolder,
            encryption_key: encryptionKey,
          });
        }
      });
      // If there was an error during start, and we haven't resolved
      streamingReadyEvent.on('init-error', (e) => {
        if (!alreadyResolved) {
          alreadyResolved = true;
          reject(e);
        }
      });
      streamingReadyEvent.on('gateway-ready', () => {
        if (!alreadyResolved) {
          alreadyResolved = true;
          resolve({
            camera_folder: cameraFolder,
            encryption_key: encryptionKey,
          });
        }
      });
    });
  } catch (e) {
    this.liveStreams.delete(cameraSelector);
    throw e;
  }
}

module.exports = {
  startStreaming,
};
