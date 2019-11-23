module.exports = function SmartThingsController(smartThingsHandler, gladys) {
  /**
   * @api {post} /api/v1/service/smartthings/schema Entry point for SmartThings schema.
   * @apiName Schema
   * @apiGroup SmartThings
   * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/schema-basics.html
   */
  async function schema(req, res) {
    const { authentication } = req.body;
    if (authentication) {
      req.headers.authorization = `${authentication.tokenType} ${authentication.token}`;
    }
    return gladys.oauth.authenticate(req, res).then(() => {
      smartThingsHandler.handleHttpCallback(req, res);
    });
  }

  /**
   * @api {post} /api/v1/service/smartthings/init Entry point for SmartThings initialization.
   * @apiName Init
   * @apiGroup SmartThings
   */
  async function init(req, res) {
    const result = await smartThingsHandler.init();

    if (result) {
      res.status(200);
    } else {
      res.status(500);
    }

    res.json({ configured: result });
  }

  return {
    'post /api/v1/service/smartthings/schema': {
      authenticated: false,
      controller: schema,
    },
    'post /api/v1/service/smartthings/init': {
      authenticated: true,
      controller: init,
    },
  };
};
