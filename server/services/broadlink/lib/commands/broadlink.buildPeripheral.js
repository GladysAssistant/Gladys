const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { PARAMS } = require('../utils/broadlink.constants');

/**
 * @description Creates Broadlink plug device.
 * @param {object} broadlinkDevice - Broadlink device.
 * @returns {object} Gladys device if Broadlink device has compatible features, else 'null'.
 * @example
 * buildPeripheral({}, 'broadlink-service-id')
 */
function buildPeripheral(broadlinkDevice) {
  const deviceMapper = this.loadMapper(broadlinkDevice);

  if (!deviceMapper) {
    return null;
  }

  const { model: name, mac, model, manufacturer } = broadlinkDevice;
  const macStr = Buffer.from(mac).toString('hex');
  const externalId = `broadlink:${macStr}`;
  const features = deviceMapper.buildFeatures(name, externalId, broadlinkDevice);

  const peripheral = {
    canLearn: !!deviceMapper.canLearn,
  };

  if (features.length !== 0) {
    // poll configuration
    const shouldPoll = features.findIndex((feature) => feature.read_only) !== -1;

    const params = [
      {
        name: PARAMS.PERIPHERAL,
        value: macStr,
      },
      {
        name: PARAMS.MANUFACTURER,
        value: `${manufacturer}`,
      },
    ];

    const device = {
      name,
      features,
      external_id: externalId,
      selector: externalId,
      model,
      service_id: this.serviceId,
      should_poll: shouldPoll,
      poll_frequency: shouldPoll ? DEVICE_POLL_FREQUENCIES.EVERY_MINUTES : null,
      params,
    };

    // Check for existing device in Gladys
    const existing = this.gladys.stateManager.get('deviceByExternalId', externalId) || {};
    peripheral.device = { ...existing, ...device };
  }

  return peripheral;
}

module.exports = {
  buildPeripheral,
};
