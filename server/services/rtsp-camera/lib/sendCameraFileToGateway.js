const Bottleneck = require('bottleneck');
const logger = require('../../../utils/logger');

// @ts-ignore
const limiter = new Bottleneck({
  maxConcurrent: 4,
});

/**
 * @description Send a camera file to Gateway.
 * @param {string} cameraFolder - The folder of the camera live.
 * @param {string} filename - The filename to upload.
 * @param {Buffer} fileContent - The content of the file to upload.
 * @example
 * sendCameraFileToGateway(cameraFolder, filename, fileContent)
 */
async function sendCameraFileToGateway(cameraFolder, filename, fileContent) {
  logger.debug(`Streaming: Uploading ${filename} to gateway.`);
  const start = Date.now();
  await this.gladys.gateway.gladysGatewayClient.cameraUploadFile(cameraFolder, filename, fileContent);
  const end = Date.now();
  logger.debug(`Camera streaming: Uploaded file to gateway in ${end - start} ms`);
}

module.exports = {
  sendCameraFileToGateway,
  sendCameraFileToGatewayLimited: limiter.wrap(sendCameraFileToGateway),
};
