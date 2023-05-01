const { NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Active Philips Hue scene.
 * @param {string} bridgeSerialNumber - The bridge serial number.
 * @param {string} sceneId - The Id of the scene.
 * @example
 * activateScene();
 */
async function activateScene(bridgeSerialNumber, sceneId) {
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  await hueApi.scenes.activateScene(sceneId);
}

module.exports = {
  activateScene,
};
