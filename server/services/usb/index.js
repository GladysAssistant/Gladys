const logger = require('../../utils/logger');
const UsbController = require('./api/usb.controller');

module.exports = function UsbService(gladys, serviceId) {
  const SerialPort = require('serialport');
  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.usb.start();
   */
  async function start() {
    logger.info('Starting usb service');
  }

  /**
   * @description List USB ports on the machine.
   * @returns {Promise} Resolve with an array of ports.
   * @example
   * gladys.services.usb.list();
   */
  async function list() {
    return SerialPort.list();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.usb.stop();
   */
  async function stop() {
    logger.info('Stopping usb service');
  }

  return Object.freeze({
    start,
    stop,
    list,
    controllers: UsbController({ list }),
  });
};
