const { Bonjour } = require('bonjour-service');

const logger = require('../../utils/logger');

const MDNS_HOST = 'gladysassistant.local';
const MDNS_SERVICE_NAME = 'Gladys Assistant';

/** @type {any} */
let bonjourInstance = null;

/**
 * @description Advertise Gladys on the local network with mDNS, as http://gladysassistant.local.
 * @param {number} port - Port of the Gladys web server.
 * @returns {any} The bonjour instance, or null if mDNS is unavailable.
 * @example
 * advertise(80);
 */
function advertise(port) {
  try {
    bonjourInstance = new Bonjour(undefined, (/** @type {any} */ error) => {
      logger.warn('mDNS: network error while advertising Gladys');
      logger.warn(error);
    });
    // probe: false = Gladys owns this name, announce it without checking for
    // conflicts first. Otherwise, a restart after a crash (no mDNS goodbye sent)
    // would detect its own stale records as a conflict and fail to advertise.
    const service = bonjourInstance.publish({
      name: MDNS_SERVICE_NAME,
      host: MDNS_HOST,
      type: 'http',
      port,
      probe: false,
    });
    service.on('error', (/** @type {any} */ error) => {
      logger.warn('mDNS: error while advertising Gladys');
      logger.warn(error);
    });
    logger.info(`mDNS: advertising Gladys as http://${MDNS_HOST}:${port}`);
    return bonjourInstance;
  } catch (e) {
    logger.warn('mDNS: unable to advertise Gladys on the local network');
    logger.warn(e);
    bonjourInstance = null;
    return null;
  }
}

/**
 * @description Stop advertising Gladys on the local network (sends mDNS goodbye packets).
 * @returns {Promise} Resolve when the mDNS instance is destroyed.
 * @example
 * await stop();
 */
async function stop() {
  if (bonjourInstance === null) {
    return;
  }
  const instance = bonjourInstance;
  bonjourInstance = null;
  try {
    await new Promise((resolve) => {
      instance.unpublishAll(() => resolve(null));
    });
    instance.destroy();
    logger.info('mDNS: stopped advertising Gladys');
  } catch (e) {
    logger.warn(e);
  }
}

module.exports = {
  advertise,
  stop,
  MDNS_HOST,
  MDNS_SERVICE_NAME,
};
