const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const { getExternalId } = require('../utils/ecovacs.externalId');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');

/**
 * @description Retrieve ecovacs devices from cloud.
 * @returns {Promise<Array<Object>>} Resolve with array of new devices.
 * @example
 * discover();
 */
async function discover() {
  if (!this.connected) {
    await this.connect();
  }
  const discoveredDevices = await this.ecovacsClient.devices();
  logger.debug(`Ecovacs: Get devices: ${JSON.stringify(discoveredDevices)}`);
  const unknownDevices = [];

  // If devices are found...
  logger.info(`Ecovacs: ${discoveredDevices.length} device(s) found while retrieving from the cloud !`);
  if (discoveredDevices.length) {
    // ...check, for each of them, ...
    await Promise.map(
      discoveredDevices,
      async (discoveredDevice) => {
        /*
        Get devices:
        [{"did":"0ccdd884-b00f-4838-a50b-bf4fb3fc7a12","name":"E0001278919601690356","class":"vi829v","resource":"NjxW","nick":null,"company":"eco-ng","bindTs":1575723788332,"service":{"jmq":"jmq-ngiot-eu.dc.ww.ecouser.net","mqs":"api-ngiot.dc-as.ww.ecouser.net"},"homeId":"626a935763a68e33482ec2e3","homeSort":9999,"deviceName":"DEEBOT OZMO 920 Series","icon":"https://portal-ww.ecouser.net/api/pim/file/get/606278d3fc527c00087fdb08","ota":true,"UILogicId":"DX_5G","materialNo":"110-1819-0101","pid":"5c19a8f3a1e6ee0001782247","product_category":"DEEBOT","model":"DX5G","updateInfo":{"needUpdate":false,"changeLog":""},"status":1,"offmap":true,"deviceNumber":0}]
        */
        logger.debug(`Vacbot: deviceName = ${discoveredDevice.deviceName},
          icon = ${discoveredDevice.icon}, pid = ${discoveredDevice.pid},
          status = ${discoveredDevice.status}, deviceNumber = ${discoveredDevice.deviceNumber}`);

        // ...if it is already in Gladys...

        const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', getExternalId(discoveredDevice));
        if (deviceInGladys) {
          logger.debug(
            `Ecovacs: Device "${discoveredDevice.deviceName}" (PID : ${discoveredDevice.pid}) is already in Gladys !`,
          );
        } else {
          logger.info(
            `Ecovacs: Device "${discoveredDevice.deviceName}" found, pid: ${discoveredDevice.pid}, model: "${discoveredDevice.model}`,
          );

          const newDevice = {
            service_id: this.serviceId,
            name: `${discoveredDevice.deviceName}`,
            selector: `${getExternalId(discoveredDevice)}`,
            external_id: `${getExternalId(discoveredDevice)}`,
            model: `${discoveredDevice.model}`,
            should_poll: true,
            poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
            features: [],
            params: [],
          };
          newDevice.features.push({
            name: 'power',
            selector: `ecovacs:${discoveredDevice.pid}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}:${discoveredDevice.deviceNumber}`,
            external_id: `ecovacs:${discoveredDevice.pid}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}:${discoveredDevice.deviceNumber}`,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            read_only: false,
            keep_history: false,
            has_feedback: true,
            min: 0,
            max: 1,
          });
          newDevice.features.push({
            name: 'battery',
            selector: `ecovacs:${discoveredDevice.pid}:${DEVICE_FEATURE_CATEGORIES.BATTERY}:${discoveredDevice.deviceNumber}`,
            external_id: `ecovacs:${discoveredDevice.pid}:${DEVICE_FEATURE_CATEGORIES.BATTERY}:${discoveredDevice.deviceNumber}`,
            category: DEVICE_FEATURE_CATEGORIES.BATTERY,
            type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
            read_only: true,
            keep_history: false,
            has_feedback: false,
            min: 0,
            max: 100,
          });
          unknownDevices.push(newDevice);
        }
      },
      { concurrency: 1 },
    );
  }
  return unknownDevices;
}

module.exports = {
  discover,
};
