module.exports = function SmartThingsController(smartThingsHandler) {
  /**
   * @api {post} /api/v1/service/smartthings/schema Entry point for SmartThings schema.
   * @apiName Schema
   * @apiGroup SmartThings
   * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/schema-basics.html
   */
  async function schema(req, res) {
    smartThingsHandler.handleHttpCallback(req, res);
  }

  return {
    'post /api/v1/service/smartthings/schema': {
      authenticated: false,
      controller: schema,
    },
  };
};
