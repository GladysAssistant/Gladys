const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const PiholeController = require('./api/pihole.controller');
const PiholeHandler = require('./lib');

const PIHOLE_IP = 'PIHOLE_IP';

module.exports = function PiholeService(gladys, serviceId) {
  let piholeIp;
  const piholeHandler = new PiholeHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the Pi-Hole service
   * @example
   * gladys.services.pihole.start();
   */
  async function start() {
    logger.info('Starting Pi-Hole service');
    piholeIp = await gladys.variable.getValue(PIHOLE_IP, serviceId);
    if (!piholeIp) {
      throw new ServiceNotConfiguredError('Pi-Hole Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the Pi-Hole service
   * @example
   * gladys.services.pihole.stop();
   */
  async function stop() {
    logger.info('Stopping Pi-Hole service');
  }

  return Object.freeze({
    start,
    stop,
    controllers: PiholeController(piholeHandler),
  });
};
