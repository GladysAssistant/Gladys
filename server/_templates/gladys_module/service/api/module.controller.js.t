---
to: ./services/<%= module %>/api/<%= module %>.controller.js
---
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function <%= className %>Controller(<%= attributeName %>Handler) {
  /**
   * @api {get} /api/v1/service/<%= module %>/status Get <%= className %> status
   * @apiName getStatus
   * @apiGroup <%= className %>
   */
  async function getStatus(req, res) {
    const response = <%= attributeName %>Handler.getStatus();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/<%= module %>/config Get <%= className %> configuration
   * @apiName getConfiguration
   * @apiGroup <%= className %>
   */
  async function getConfiguration(req, res) {
    const config = <%= attributeName %>Handler.getConfiguration();
    res.json(config);
  }

  /**
   * @api {post} /api/v1/service/<%= module %>/config Save <%= className %> configuration
   * @apiName saveConfiguration
   * @apiGroup <%= className %>
   */
  async function saveConfiguration(req, res) {
    await <%= attributeName %>Handler.saveConfiguration(req.body);
    res.json({ success: true });
  }

  return {
    'get /api/v1/service/<%= module %>/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/<%= module %>/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/<%= module %>/config': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    }
  };
};
