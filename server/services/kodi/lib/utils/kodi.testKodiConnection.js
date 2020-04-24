const kodi = require('node-kodi-ws');

// @ts-nocheck
const logger = require('../../../../utils/logger');
const { BadParameters, NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @public
 * @description This function test kodi server connection and return state.
 * @param {Object} device - The Kodi device to test.
 * @example
 * kodi.testKodiConnection('localhost', '9090');
 * @returns {string} The server status.
 */
async function testKodiConnection(device) {
  let host;
  let port;
  device.params.forEach((item, i) => {
    if (item.name === 'host') {
      host = item.value;
    } else if (item.name === 'port') {
      port = item.value;
    }
  });
  return new Promise(async (resolve, reject) => {
    if (!host) {
      return reject(new NotFoundError('HOST_IS_EMPTY'));
    }
    if (!port) {
      return reject(new NotFoundError('PORT_IS_EMPTY'));
    }

    logger.debug(`Try to test connection on Kodi with host : ${host} (port : ${port} )`);
    await kodi(host, port)
      .then(function initKodiConnection(connection) {
        resolve('OK');
      })
      .catch((err) => {
        reject(new BadParameters('HOST_OR_PORT_IS_BAD_OR_KODI_NOT_UP'));
      });

    return null;
  });
}

module.exports = {
  testKodiConnection,
};
