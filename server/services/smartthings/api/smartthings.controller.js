const logger = require('../../../utils/logger');

module.exports = function SmartThingsController(smartThingsHandler) {
  /**
   * @api {post} /api/v1/service/smartthings/schema Entry point for SmartThings schema.
   * @apiName Schema
   * @apiGroup SmartThings
   */
  async function schema(req, res) {
    const { headers } = req.body;
    const { interactionType } = headers;

    let response;
    switch (interactionType) {
      case 'discoveryRequest': {
        response = smartThingsHandler.discoveryRequest();
        response.headers = { ...headers, interactionType: 'discoveryResponse' };
        break;
      }
      case 'stateRefreshRequest': {
        response = smartThingsHandler.stateRefreshRequest(req.body.devices);
        response.headers = { ...headers, interactionType: 'stateRefreshResponse' };
        break;
      }
      default: {
        response = {};
        res.status(500);
        logger.warn(`SmartThings service don't support '${interactionType}' interaction type yet.`);
        logger.trace('%j', req.body);
      }
    }

    res.send(response);
  }

  return {
    'post /api/v1/service/smartthings/schema': {
      authenticated: true,
      controller: schema,
    },
  };
};
