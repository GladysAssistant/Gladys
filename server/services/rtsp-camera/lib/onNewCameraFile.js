const path = require('path');
const { promises: fs } = require('fs');
const getConfig = require('../../../utils/getConfig');
const logger = require('../../../utils/logger');

const config = getConfig();

/**
 *
 * @description When a new camera file is detected.
 * @param {string} cameraSelector - The selector of the camera.
 * @param {string} folderPath - The full path to camera folder.
 * @param {string} cameraFolder - The name of the camera folder.
 * @param {string} filename - The filename that changed.
 * @param {object} sharedObjectToVerify - A shared object to init.
 * @param {object} streamingReadyEvent - To emit an event when gateway is ready.
 * @returns {Promise} - Resolve when camera file is handled.
 * @example onNewCameraFile();
 */
async function onNewCameraFile(
  cameraSelector,
  folderPath,
  cameraFolder,
  filename,
  sharedObjectToVerify,
  streamingReadyEvent,
) {
  if (!filename) {
    return null;
  }
  // Temp file and key file are not uploaded
  //
  // We don't upload the key to Gladys Plus
  // So the end-to-end encryption is respected.
  // Instead, we upload a dumb file that will be
  // hot replaced on the client side with the correct key
  // The key is sent end-to-end encrypted in Websockets :)
  if (filename === 'index.m3u8.tmp' || filename === 'index.m3u8.key') {
    return null;
  }
  const liveStream = this.liveStreams.get(cameraSelector);
  if (!liveStream) {
    return null;
  }
  if (!liveStream.isGladysGateway) {
    return null;
  }
  try {
    const fileChangedPath = path.join(folderPath, filename);
    let fileContent = await fs.readFile(fileChangedPath);

    // We need to hot replace the key file URL with the Gateway URL
    if (filename === 'index.m3u8') {
      const newFileContentString = fileContent
        .toString()
        .replace(
          `BACKEND_URL_TO_REPLACE/api/v1/service/rtsp-camera/camera/streaming/${cameraFolder}/index.m3u8.key`,
          `${config.gladysGatewayServerUrl}/cameras/${cameraFolder}/index.m3u8.key`,
        );
      fileContent = Buffer.from(newFileContentString, 'utf8');
    }

    // Uploading file to Gateway
    await this.sendCameraFileToGatewayLimited(cameraFolder, filename, fileContent);
    if (filename === 'index.m3u8') {
      const previousValue = sharedObjectToVerify.indexUploaded;
      sharedObjectToVerify.indexUploaded = true;
      if (!previousValue) {
        streamingReadyEvent.emit('gateway-ready');
      }
    }
  } catch (e) {
    logger.error(`Unable to upload file ${filename}`);
    logger.error(e);
  }
  return null;
}

module.exports = {
  onNewCameraFile,
};
