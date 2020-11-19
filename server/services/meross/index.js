const logger = require('../../utils/logger');
const MerossPlugHandler = require('./lib/plug');

const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

const MEROSS_KEY = 'MEROSS_KEY';

module.exports = function MerossService(gladys, serviceId) {
  const axios = require('axios');
  let merossKey;

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
    merossKey = await gladys.variable.getValue(MEROSS_KEY, serviceId);
    if (!merossKey) {
      throw new ServiceNotConfiguredError('Meross not configured');
    }
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
    device: new MerossPlugHandler(gladys, client, function getKey() {
      return merossKey;
    }),
  });
};
