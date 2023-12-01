const logger = require('../../../../utils/logger');
const features = require('../features');
const { getExternalId } = require('../utils/externalId');

/**
 * @description Retrieve eWelink devices from cloud.
 * @returns {Promise<Array<object>>} Resolve with array of new devices.
 * @example
 * discover();
 */
async function discover() {
  const { thingList = [] } = await this.handleRequest(async () => this.ewelinkClient.device.getAllThingsAllPages());
  logger.info(`eWeLink: ${thingList.length} device(s) found while retrieving from the cloud !`);

  const discoveredDevices = [];

  thingList.forEach(({ itemData }) => {
    const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', getExternalId(itemData));
    // ...if it is already in Gladys, ignore it...
    if (deviceInGladys) {
      logger.debug(`eWeLink: device "${itemData.deviceid}" is already in Gladys !`);
    } else {
      logger.debug(`eWeLink: new device "${itemData.deviceid}" (${itemData.productModel}) discovered`);
      const discoveredDevice = features.getDevice(this.serviceId, itemData);
      discoveredDevices.push(discoveredDevice);
    }
  });

  return discoveredDevices;
}

module.exports = {
  discover,
};
