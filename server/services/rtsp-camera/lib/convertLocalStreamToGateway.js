const { promises: fs } = require('fs');
const Promise = require('bluebird');
const EvenEmitter = require('events');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Convert a local stream to a gateway stream.
 * @param {string} cameraSelector - The camera selector.
 * @returns {Promise} Resolve when finished.
 * @example
 * sendCameraFileToGateway(cameraFolder, filename, fileContent)
 */
async function convertLocalStreamToGateway(cameraSelector) {
  logger.debug(`Streaming: ConvertLocalStreamToGateway for camera ${cameraSelector}`);
  const liveStream = this.liveStreams.get(cameraSelector);
  if (!liveStream) {
    throw new NotFoundError('STREAM_NOT_FOUND');
  }
  const { fullFolderPath, cameraFolder } = liveStream;
  this.liveStreams.set(cameraSelector, {
    ...liveStream,
    isGladysGateway: true,
  });
  if (fullFolderPath && cameraFolder) {
    const event = new EvenEmitter();
    const filesInFolder = await fs.readdir(fullFolderPath, {
      withFileTypes: true,
    });
    await Promise.map(filesInFolder, async (file) => {
      if (file.isFile()) {
        logger.debug(`ConvertLocalStreamToGateway: Uploading ${file.name} to Gateway`);
        await this.onNewCameraFile(cameraSelector, fullFolderPath, cameraFolder, file.name, {}, event);
      }
    });
  }
  return null;
}

module.exports = {
  convertLocalStreamToGateway,
};
