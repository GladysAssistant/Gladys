const { getGladysBasePath } = require('../../lib/system/system.getGladysBasePath');
const logger = require('../../utils/logger');
const HomeKitHandler = require('./lib');
const { mappings } = require('./lib/deviceMappings');

module.exports = function HomeKitService(gladys, serviceId) {
  const hap = require('hap-nodejs');

  const homeKitHandler = new HomeKitHandler(gladys, serviceId, hap);

  let bridge;
  /**
   * @public
   * @description This function starts the HomeKit service and expose devices
   * @returns {Promise} Empty promise once service is started.
   * @example
   * gladys.services.homekit.start();
   */
  async function start() {
    logger.info('Starting HomeKit service');
    const dockerBased = await gladys.system.isDocker();
    if (dockerBased) {
      const { basePathOnContainer } = await getGladysBasePath();
      hap.HAPStorage.setCustomStoragePath(`${basePathOnContainer}/homekit`);
    }

    const devices = await gladys.device.get();
    const compatibleDevices = devices.filter((device) => {
      return device.features.find((feature) => {
        return Object.keys(mappings).includes(feature.category);
      });
    });
    const accessories = compatibleDevices.map((device) => homeKitHandler.buildAccessory(device));

    let pincode = await gladys.variable.getValue('HOMEKIT_PIN_CODE', serviceId);

    if (!pincode) {
      pincode = await homeKitHandler.newPinCode();
    }

    if (bridge) {
      await bridge.unpublish();
    }

    bridge = await homeKitHandler.createBridge(accessories);
    await bridge.publish({
      username: '71:51:07:F4:BC:A8',
      pincode,
      port: '47129',
      category: hap.Categories.BRIDGE,
    });
    await gladys.variable.setValue('HOMEKIT_SETUP_URI', bridge.setupURI(), serviceId);
  }

  /**
   * @public
   * @description This function stops the HomeKit service
   * @example
   * gladys.services.caldav.stop();
   */
  async function stop() {
    logger.info('Stopping HomeKit service');
  }

  return Object.freeze({
    start,
    stop,
  });
};
