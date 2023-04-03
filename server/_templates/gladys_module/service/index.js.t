---
to: ./services/<%= module %>/index.js
---

const logger = require('../../utils/logger');
const <%= className %>Handler = require('./lib');
const <%= className %>Controller = require('./api/<%= module %>.controller');

module.exports = function <%= className %>Service(gladys, serviceId) {
  const <%= attributeName %>Handler = new <%= className %>Handler(gladys, serviceId);

  /**
   * @public
   * @description Starts the <%= module %> service.
   * @example
   * gladys.services.<%= module %>.start();
   */
  async function start() {
    logger.info('Starting <%= module %> service');
    await <%= attributeName %>Handler.start();
  }

  /**
   * @public
   * @description This function stops the <%= module %> service
   * @example
   * gladys.services.<%= module %>.stop();
   */
  async function stop() {
    logger.info('Stopping <%= module %> service');
    await <%= attributeName %>Handler.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: <%= attributeName %>Handler,
    controllers: <%= className %>Controller(<%= attributeName %>Handler),
  });
};
