const logger = require('../../utils/logger');
const W215Handler = require('./lib/device');
const W215Controller = require('./api/w215.controller');

module.exports = function w215Service(gladys, serviceId) {
  const w215Handler = new W215Handler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the ExampleService service
   * @example
   * gladys.services.example.start();
   */
  async function start() {
    // Anything to run at startup
    logger.log('starting DSP-W215 service');
  }

  /**
   * @public
   * @description This function stops the ExampleService service
   * @example
   * gladys.services.example.stop();
   */
  async function stop() {
    // Anything to do on stop
    logger.log('stopping DSP-W215 service');
  }

  return Object.freeze({
    start,
    stop,
    device: w215Handler,
    controllers: W215Controller(w215Handler),
  });
};
