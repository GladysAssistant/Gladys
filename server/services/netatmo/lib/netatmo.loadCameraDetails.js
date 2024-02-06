const Promise = require('bluebird');
const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud cameras.
 * @returns {Promise} List of discovered cameras and modules.
 * @example
 * await loadCameraDetails();
 */
async function loadCameraDetails() {
  logger.debug('loading Cameras details...');
  const cameras = [];
  const modules = [];
  try {
    const response = await axios({
      url: API.GET_CAMERAS,
      method: 'get',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
    });
    const { body, status } = response.data;
    const { homes } = body;
    if (status === 'ok') {
      homes.forEach((home) => {
        cameras.push(...home.cameras);
      });
      if (cameras) {
        cameras.forEach((camera) => {
          if (camera.modules) {
            modules.push(...camera.modules);
          }
        });
      }
    }
    logger.debug('Cameras details loaded in home');
    console.log({ cameras, modules });
    return { cameras, modules };
  } catch (e) {
    logger.error('Error getting Cameras details - status error: ', e.status, ' data error: ', e.response.data.error);
    return { cameras: undefined, modules: undefined };
  }
}

module.exports = {
  loadCameraDetails,
};
