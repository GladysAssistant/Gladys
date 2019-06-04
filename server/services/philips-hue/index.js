const logger = require('../../utils/logger');
const PhilipsHueLightHandler = require('./lib/light');
const HueController = require('./api/hue.controller');
const db = require('../../models');

module.exports = function PhilipsHueService(gladys, serviceId) {
  // require the node-hue-api module
  const hueClient = require('node-hue-api');
  const philipsHueLightHandler = new PhilipsHueLightHandler(gladys, hueClient, serviceId);

  /**
   * @public
   * @description This function starts the PhilipsHueService service.
   * @example
   * gladys.services['philips-hue'].start();
   */
  async function start() {
    logger.log('starting Philips Hue service');
    // Initialization of existing Hue Bridge
    const device = await db.Device.findOne({
      where: {
        service_id: serviceId,
      },
      include: [
        {
          model: db.DeviceParam,
          as: 'params',
        },
      ],
    });
    if (device != null) {
      const ipAddress = device.params
        .filter((p) => p.dataValues.name === 'BRIDGE_IP_ADDRESS')
        .map((p) => p.dataValues.value);
      const userId = device.params.filter((p) => p.dataValues.name === 'BRIDGE_USER_ID').map((p) => p.dataValues.value);
      logger.info(`Connecting to hue bridge ${device.name} at ${ipAddress}...`);
      philipsHueLightHandler.init(ipAddress, userId);
    }
    return null;
  }

  /**
   * @public
   * @description This function stops the PhilipsHueService service
   * @example
   *  gladys.services['philips-hue'].stop();
   */
  async function stop() {
    logger.log('stopping Philips Hue service');
  }

  return Object.freeze({
    start,
    stop,
    light: philipsHueLightHandler,
    controllers: HueController(philipsHueLightHandler),
  });
};
