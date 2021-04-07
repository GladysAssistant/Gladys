const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');
const LGTVController = require('./api/lgtv.controller.js');
const LGTVHandler = require('./lib/tv');

module.exports = function LGTVService(gladys) {
  const lgtvHandler = new LGTVHandler(gladys);

  /**
   * @public
   * @description This function starts the ExampleService service
   * @example
   * gladys.services.example.start();
   */
  async function start() {
    logger.info('Starting LGTV service');

    gladys.event.on(EVENTS.WEBSOCKET.RECEIVE, lgtvHandler.promptListener.bind(lgtvHandler));

    await lgtvHandler.connectAll();
  }

  /**
   * @public
   * @description This function stops the ExampleService service
   * @example
   * gladys.services.example.stop();
   */
  async function stop() {
    logger.info('Stopping LGTV service');
    await lgtvHandler.disconnectAll();
  }

  return Object.freeze({
    start,
    stop,
    device: lgtvHandler,
    controllers: LGTVController(lgtvHandler),
  });
};
