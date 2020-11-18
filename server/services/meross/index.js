const logger = require('../../utils/logger');
const MerossPlugHandler = require('./lib/plug');

module.exports = function MerossService(gladys) {
  const axios = require('axios');

  // @ts-ignore: TS doesn't know about the axios.create function
  const client = axios.create({
    timeout: 1000,
  });
  /**
   * @public
   * @description This function starts the MerossService service
   * @example
   * gladys.services.meross.start();
   */
  async function start() {
    logger.log('starting meross service');
  }

  /**
   * @public
   * @description This function stops the MerossService service
   * @example
   * gladys.services.meross.stop();
   */
  async function stop() {
    logger.log('stopping meross service');
  }

  return Object.freeze({
    start,
    stop,
    device: new MerossPlugHandler(gladys, client),
  });
};