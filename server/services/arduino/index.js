const logger = require('../../utils/logger');
const ArduinoController = require('./api/arduino.controller');
/*const setup = require('./lib/setup.js');
const connect = require('./lib/connect.js');
const sendCode = require('./lib/sendCode.js');*/

module.exports = function ArduinoService(gladys, serviceId) {
    const SerialPort = require('serialport');

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.serial.start();
   */
  async function start() {
    logger.log('starting Arduino service');
  }

  /**
   * @description List Serial ports on the machine.
   * @returns {Promise} Resolve with an array of ports.
   * @example
   * gladys.services.arduino.list();
   */
  async function list() {
    return new Promise((resolve, reject) => {
      SerialPort.list((err, ports) => {
        if (err) {
          return reject(err);
        }

        return resolve(ports);
      });
    });
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.arduino.stop();
   */
  async function stop() {
    logger.log('stopping Serial service');
  }

  return Object.freeze({
    start,
    stop,
    list,
    controllers: ArduinoController({ list }),
  });
};
