module.exports = function LANManagerController(lanManager) {
  /**
   * @api {get} /api/v1/service/lan-manager/discover Get LAN discovered devices
   * @apiName getDiscoveredDevices
   * @apiGroup LANManager
   */
  function getDiscoveredDevices(req, res) {
    const { query = {} } = req;
    const devices = lanManager.getDiscoveredDevices(query);
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/lan-manager/discover Start LAN device discovering
   * @apiName scan
   * @apiGroup LANManager
   */
  function scan(req, res) {
    if (req.body.scan === 'on') {
      lanManager.scan();
    } else {
      lanManager.stop();
    }

    res.json(lanManager.getStatus());
  }

  /**
   * @api {get} /api/v1/service/lan-manager/status Get LAN anager status
   * @apiName getStatus
   * @apiGroup LANManager
   */
  function getStatus(req, res) {
    const status = lanManager.getStatus();
    res.json(status);
  }

  /**
   * @api {get} /api/v1/service/lan-manager/config Get LAN anager configuration
   * @apiName getConfiguration
   * @apiGroup LANManager
   */
  function getConfiguration(req, res) {
    const config = lanManager.getConfiguration();
    res.json(config);
  }

  /**
   * @api {post} /api/v1/service/lan-manager/config Save LAN anager configuration
   * @apiName saveConfiguration
   * @apiGroup LANManager
   */
  async function saveConfiguration(req, res) {
    const config = await lanManager.saveConfiguration(req.body);
    res.json(config);
  }

  return {
    'get /api/v1/service/lan-manager/discover': {
      authenticated: true,
      controller: getDiscoveredDevices,
    },
    'post /api/v1/service/lan-manager/discover': {
      authenticated: true,
      controller: scan,
    },
    'get /api/v1/service/lan-manager/status': {
      authenticated: true,
      controller: getStatus,
    },
    'get /api/v1/service/lan-manager/config': {
      authenticated: true,
      controller: getConfiguration,
    },
    'post /api/v1/service/lan-manager/config': {
      authenticated: true,
      controller: saveConfiguration,
    },
  };
};
