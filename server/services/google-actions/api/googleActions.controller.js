module.exports = function GoogleActionsController(googleActionsHandler) {
  /**
   * @api {post} /api/v1/service/google-actions/smarthome Entry point for GoogleActions smarthome.
   * @apiName Smarthome
   * @apiGroup GoogleActions
   */
  async function smarthome(req, res) {
    req.body.user = req.user;
    return googleActionsHandler.smarthome(req, res);
  }

  /**
   * @api {post} /api/v1/service/google-actions/init Entry point for GoogleActions initialization.
   * @apiName Init
   * @apiGroup GoogleActions
   */
  async function init(req, res) {
    await googleActionsHandler.storeParams(req.body.value, req.user);
    const result = await googleActionsHandler.init();
    res.json({ configured: result });
  }

  return {
    'post /api/v1/service/google-actions/smarthome': {
      authenticated: true,
      controller: smarthome,
    },
    'post /api/v1/service/google-actions/init': {
      authenticated: true,
      controller: init,
    },
  };
};
