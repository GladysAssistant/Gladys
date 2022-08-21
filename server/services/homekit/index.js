const logger = require('../../utils/logger');
const HomeKitHandler = require('./lib');
const { mappings } = require('./lib/deviceMappings');

module.exports = function HomeKitService(gladys, serviceId) {
  const hap = require('hap-nodejs');

  const homeKitHandler = new HomeKitHandler(gladys, serviceId, hap);

  /**
   * @public
   * @description This function starts the HomeKit service and expose devices
   * @example
   * gladys.services.homekit.start();
   */
  async function start() {
    logger.info('Starting HomeKit service');
    const devices = await gladys.device.get();
    const compatibleDevices = devices.filter((device) => {
      return device.features.find((feature) => {
        return Object.keys(mappings).includes(feature.category);
      });
    });
    console.log(JSON.stringify(compatibleDevices, null, 2));
    const accessories = compatibleDevices.map(device => homeKitHandler.buildAccessory(device));

    const bridge = homeKitHandler.createBridge(accessories);
    bridge.publish({
      username: '71:51:07:F4:BC:A8',
      pincode: '876-09-678',
      port: '47129',
      category: hap.Categories.BRIDGE
    });
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
