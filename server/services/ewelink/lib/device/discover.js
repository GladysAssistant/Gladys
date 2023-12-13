const { mergeDevices } = require('../../../../utils/device');
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
  const { thingList = [] } = await this.handleRequest(async () =>
    this.ewelinkWebAPIClient.device.getAllThingsAllPages(),
  );
  logger.info(`eWeLink: ${thingList.length} device(s) found while retrieving from the cloud !`);

  const discoveredDevices = thingList.map(({ itemData }) => {
    logger.debug(`eWeLink: new device "${itemData.deviceid}" (${itemData.productModel}) discovered`);

    const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', getExternalId(itemData));
    const discoveredDevice = features.getDevice(this.serviceId, itemData);
    return mergeDevices(discoveredDevice, deviceInGladys);
  });

  this.discoveredDevices = discoveredDevices;

  return discoveredDevices;
}

module.exports = {
  discover,
};
