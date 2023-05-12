const logger = require('../../utils/logger');
const ExampleLightHandler = require('./lib/light');

module.exports = function ExampleService(gladys) {
  // here is an example module
  const axios = require('axios');

  // @ts-ignore: TS doesn't know about the axios.create function
  const client = axios.create({
    timeout: 1000,
  });
  const device = new ExampleLightHandler(gladys, client);

  /**
   * @public
   * @description This function starts the ExampleService service.
   * @example
   * gladys.services.example.start();
   */
  async function start() {
    logger.info('Starting example service');
  }

  /**
   * @public
   * @description This function stops the ExampleService service.
   * @example
   * gladys.services.example.stop();
   */
  async function stop() {
    logger.info('Stopping example service');
  }

  return Object.freeze({
    start,
    stop,
    light: device,
    device,
  });
};
