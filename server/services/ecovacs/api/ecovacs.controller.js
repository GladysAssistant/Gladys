module.exports = function EcovacsController(ecovacsHandler) {
  /**
   * @api {get} /api/v1/service/ecovacs/status Get AndroidTv status
   * @apiName getStatus
   * @apiGroup Ecovacs
   */
  async function getStatus(req, res) {
    const response = ecovacsHandler.getStatus();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/ecovacs/config Get Ecovacs configuration
   * @apiName getConfiguration
   * @apiGroup Ecovacs
   */
  async function getConfiguration(req, res) {
    const config = ecovacsHandler.getConfiguration();
    res.json(config);
  }

  /**
   * @api {post} /api/v1/service/ecovacs/config Save Ecovacs configuration
   * @apiName saveConfiguration
   * @apiGroup Ecovacs
   */
  async function saveConfiguration(req, res) {
    const config = ecovacsHandler.saveConfiguration(req.body);
    res.json(config);
  }

  return {
    'get /api/v1/service/ecovacs/status': {
      authenticated: true,
      controller: getStatus,
    },
    'get /api/v1/service/ecovacs/config': {
      authenticated: true,
      controller: getConfiguration,
    },
    'post /api/v1/service/ecovacs/config': {
      authenticated: true,
      controller: saveConfiguration,
    }
  };
};
