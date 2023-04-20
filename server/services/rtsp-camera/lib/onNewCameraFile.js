const path = require('path');
const { promises: fs } = require('fs');

const logger = require('../../../utils/logger');

/**
 *
 * @description When a new camera file is detected.
 * @param {string} cameraSelector - The selector of the camera.
 * @param {string} folderPath - The full path to camera folder.
 * @param {string} cameraFolder - The name of the camera folder.
 * @param {string} filename - The filename that changed.
 * @param {Object} sharedObjectToVerify - A shared object to init.
 * @param {Object} streamingReadyEvent - To emit an event when gateway is ready.
 * @returns Promise
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
  const liveStream = this.liveStreams.get(cameraSelector);
  if (!liveStream) {
    return null;
  }
  if (!liveStream.isGladysGateway) {
    return null;
  }
  if (!filename) {
    return null;
  }
  if (filename === 'index.m3u8.tmp') {
    return null;
  }
  try {
    const fileChangedPath = path.join(folderPath, filename);
    let fileContent;
    // We don't upload the key to Gladys Plus
    // So the end-to-end encryption is respected.
    // Instead, we upload a dumb file that will be
    // hot replaced on the client side with the correct key
    // The key is sent end-to-end encrypted in Websockets :)
    if (filename === 'index.m3u8.key') {
      fileContent = Buffer.from('not-a-key', 'utf8');
    } else {
      fileContent = await fs.readFile(fileChangedPath);
    }
    // If we are currently in dual mode (Local + Gateway)
    // We need to hot-replace the key path
    if (filename === 'index.m3u8' && liveStream.gatewayBackendUrl) {
      const newFileContentString = fileContent
        .toString()
        .replace(
          `${liveStream.backendUrl}/api/v1/service/rtsp-camera/camera/streaming/${cameraFolder}/index.m3u8.key`,
          `${liveStream.gatewayBackendUrl}/cameras/${cameraFolder}/index.m3u8.key`,
        );
      fileContent = Buffer.from(newFileContentString, 'utf8');
    }
    // Uploading file to Gateway
    await this.sendCameraFileToGatewayLimited(cameraFolder, filename, fileContent);
    const checkIfGatewayReady = (previousValue) => {
      if (sharedObjectToVerify.indexUploaded && sharedObjectToVerify.keyUploaded && !previousValue) {
        streamingReadyEvent.emit('gateway-ready');
      }
    };
    if (filename === 'index.m3u8') {
      const previousValue = sharedObjectToVerify.indexUploaded;
      sharedObjectToVerify.indexUploaded = true;
      checkIfGatewayReady(previousValue);
    }
    if (filename === 'index.m3u8.key') {
      const previousValue = sharedObjectToVerify.keyUploaded;
      sharedObjectToVerify.keyUploaded = true;
      checkIfGatewayReady(previousValue);
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
