const Arpping = require('arpping');

const logger = require('../../utils/logger');
const LANManager = require('./lib');
const LANManagerController = require('./api/lan-manager.controller');
const { SCAN_OPTIONS } = require('./lib/lan-manager.constants');

module.exports = function LANManagerService(gladys, serviceId) {
  const arpping = new Arpping({
    interfaceFilters: { interface: SCAN_OPTIONS.INTERFACES, family: SCAN_OPTIONS.IP_FAMILY },
    useCache: false,
  });

  const lanManager = new LANManager(gladys, serviceId, arpping);

  /**
   * @public
   * @description Starts the LAN Manager service.
   * @example
   * gladys.services['lan-manager'].start();
   */
  async function start() {
    logger.info('Starting LAN Manager service');
    await lanManager.init();
  }

  /**
   * @public
   * @description This function stops the Bluetooth service
   * @example
   * gladys.services['lan-manager'].stop();
   */
  async function stop() {
    logger.info('Stopping LAN Manager service');
    lanManager.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: lanManager,
    controllers: LANManagerController(lanManager),
  });
};
