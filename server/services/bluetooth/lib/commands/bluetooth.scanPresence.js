const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, EVENTS } = require('../../../../utils/constants');

/**
 * @description Scan periodically for device presence.
 * @returns {Promise} Resolve when scan finished.
 * @example
 * await this.scanPresence();
 */
async function scanPresence() {
  const devices = await this.gladys.device.get({
    service: 'bluetooth',
    device_feature_category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
  });

  const features = [];
  // Extract only presence features
  devices.forEach((device) => {
    device.features
      .filter((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR)
      .forEach((feature) => features.push(feature));
  });

  const nbPresenceFeatures = features.length;
  logger.debug(`Bluetooth: ${nbPresenceFeatures} presence sensor features`);
  if (nbPresenceFeatures > 0) {
    const peripherals = await this.scan(true);

    features.forEach((feature) => {
      const { external_id: externalId } = feature;
      const [, peripheralUuid] = externalId.split(':');

      if (peripherals[peripheralUuid]) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: 1,
        });
      }
    });
  }

  return null;
}

module.exports = {
  scanPresence,
};
