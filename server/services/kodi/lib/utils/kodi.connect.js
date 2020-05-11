const kodi = require('node-kodi-ws');
const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { getAllKodi } = require('../../../../lib/device/kodi/kodi.getAllKodi');

/**
 * @description Connect Kodi Media Center and build connection.
 * @example
 * kodi.connect();
 */
async function connect() {
  // GET all Kodi devices
  const devices = await getAllKodi();

  if (!devices) {
    throw new ServiceNotConfiguredError('No Kodi device configured');
  }

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < devices.length; i += 1) {
    let kodiConnection;
    let host = '';
    let port = '';
    for (let j = 0; j < devices[i].params.length; j += 1) {
      if (devices[i].params[j].name === 'host') {
        host = devices[i].params[j].value;
      } else if (devices[i].params[j].name === 'port') {
        port = devices[i].params[j].value;
      }
    }

    logger.debug(`'Try to connect to kodi with host = ${host} on port ${port}'`);
    await kodi(host, port)
      .then(function initKodiConnection(connection) {
        kodiConnection = connection;
      })
      .catch((err) => {
        logger.error('Kodi connection timeout or other error: ', err);
      });

    if (kodiConnection) {
      if (this.mapOfKodiConnection === null) {
        this.mapOfKodiConnection = new Map();
      }
      this.mapOfKodiConnection.set(devices[i].id, kodiConnection);
      this.poll(devices[i]);
    }
  }
}

module.exports = {
  connect,
};
