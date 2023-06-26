const { NmapScan } = require('node-sudo-nmap');

const logger = require('../../utils/logger');
const LANManager = require('./lib');
const LANManagerController = require('./api/lan-manager.controller');

module.exports = function LANManagerService(gladys, serviceId) {
  const lanManager = new LANManager(gladys, serviceId, NmapScan);

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
   * @description This function stops the Bluetooth service.
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
