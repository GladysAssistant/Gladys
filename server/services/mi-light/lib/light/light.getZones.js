const Promise = require('bluebird');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { getDeviceParam } = require('../../../../utils/device');
const { LIGHT_EXTERNAL_ID_BASE, BRIDGE_MAC } = require('../utils/consts');

/**
 * @description Get light zones from all connected bridges.
 * @returns {Promise<Array>} Resolve with array of zone.
 * @example
 * getZones();
 */
async function getZones() {
  const lightsToReturn = [];

  await Promise.map(this.connectedBridges, async (device) => {
    // get bridge Mac and remove ":" to store it as reference in the light object
    const bridgeMacWithoutColomn = getDeviceParam(device, BRIDGE_MAC).replace(/:/g, '');
    for (let x = 0; x < 5; x += 1) {
      lightsToReturn.push({
        name: `Zone:${x}`,
        zone: x,
        service_id: this.serviceId,
        external_id: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeMacWithoutColomn}:${x}`,
        selector: `${LIGHT_EXTERNAL_ID_BASE}:${bridgeMacWithoutColomn}:${x}`,
        should_poll: false,
        model: 'default',
        features: [
          {
            name: 'On/Off',
            selector: `zone:${x}:binary`,
            external_id: `zone:${x}:binary`,
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
            read_only: false,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 1,
          },
        ],
        // not_handled: false,
      });
    }
  });
  return lightsToReturn;
}

module.exports = {
  getZones,
};
