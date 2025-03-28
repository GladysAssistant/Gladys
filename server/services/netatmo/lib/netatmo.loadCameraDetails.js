const Promise = require('bluebird');
const { default: axios } = require('axios');
const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_CATEGORY_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud cameras.
 * @returns {Promise} List of discovered cameras and modules.
 * @example
 * await loadCameraDetails();
 */
async function loadCameraDetails() {
  logger.debug('loading Cameras details...');
  const devices = [];
  const modules = [];
  try {
    const response = await fetch(API.GET_CAMERAS, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
    });
    const rawBody = await response.text();
    if (!response.ok) {
      logger.error('Netatmo error: ', response.status, rawBody);
    }

    const data = JSON.parse(rawBody);
    const { body, status } = data;

    // const response = await axios({
    //   url: API.GET_CAMERAS,
    //   method: 'get',
    //   headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
    // });
    // const { body, status } = response.data;

    const { homes } = body;
    if (status === 'ok') {
      homes.forEach((home) => {
        if (home.cameras) {
          devices.push(...home.cameras);
        }
      });
      if (devices.length > 0) {
        devices.forEach((device) => {
          if (!this.configuration.securityApi) {
            device.apiNotConfigured = true;
          } else {
            device.apiNotConfigured = false;
          }
          device.categoryAPI = SUPPORTED_CATEGORY_TYPE.SECURITY;
          if (device.modules) {
            device.modules.forEach((module) => {
              const { modules: mods, ...rest } = device;
              module.plug = rest;
              if (!this.configuration.securityApi) {
                module.apiNotConfigured = true;
              } else {
                module.apiNotConfigured = false;
              }
              module.categoryAPI = SUPPORTED_CATEGORY_TYPE.SECURITY;
            });
            modules.push(...device.modules);
          }
        });
      }
    }
    console.log('devices', devices);
    console.log('modules', modules);
    logger.debug('Cameras details loaded in home');
    return { devices, modules };
  } catch (e) {
    logger.error('Error getting Cameras details - status error: ', e.status, ' data error: ', e.response.data.error);
    return { devices: undefined, modules: undefined };
  }
}

module.exports = {
  loadCameraDetails,
};
