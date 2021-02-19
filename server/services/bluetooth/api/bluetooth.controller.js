module.exports = function BluetoothController(bluetoothManager) {
  /**
   * @api {get} /api/v1/service/bluetooth/status Get Bluetooth status
   * @apiName getStatus
   * @apiGroup Bluetooth
   */
  async function getStatus(req, res) {
    res.json(bluetoothManager.getStatus());
  }

  /**
   * @api {get} /api/v1/service/bluetooth/peripheral Get Bluetooth discovered peripherals
   * @apiName getDevices
   * @apiGroup Bluetooth
   */
  async function getDiscoveredDevices(req, res) {
    const peripherals = bluetoothManager.getDiscoveredDevices();
    res.json(peripherals);
  }

  /**
   * @api {get} /api/v1/service/bluetooth/peripheral/bluetooth-:uuid Get Bluetooth discovered peripheral by uuid
   * @apiName getDevice
   * @apiGroup Bluetooth
   */
  async function getDiscoveredDevice(req, res) {
    const { uuid } = req.params;
    const peripheral = bluetoothManager.getDiscoveredDevice(uuid);
    if (!peripheral) {
      res.status(404);
    }
    res.json(peripheral);
  }

  /**
   * @api {post} /api/v1/service/bluetooth/scan Scan Bluetooth peripherals
   * @apiName scan
   * @apiGroup Bluetooth
   */
  async function scan(req, res) {
    const scanAction = req.body.scan === 'on';
    bluetoothManager.scan(scanAction);
    res.json(bluetoothManager.getStatus());
  }

  /**
   * @api {post} /api/v1/service/bluetooth/scan/bluetooth-:uuid Scan Bluetooth peripheral
   * @apiName scanDevice
   * @apiGroup Bluetooth
   */
  async function scanDevice(req, res) {
    const { uuid } = req.params;
    bluetoothManager.scanDevice(uuid);
    res.json(bluetoothManager.getStatus());
  }

  /**
   * @api {post} /api/v1/service/bluetooth/presence Start presence scanner
   * @apiName scanPresence
   * @apiGroup Bluetooth
   */
  async function scanPresence(req, res) {
    bluetoothManager.scanPresence();
    res.status(200);
  }

  /**
   * @api {get} /api/v1/service/bluetooth/config Get Bluetooth configuration
   * @apiName getConfiguration
   * @apiGroup Bluetooth
   */
  async function getConfiguration(req, res) {
    const config = bluetoothManager.getConfiguration();
    res.json(config);
  }

  /**
   * @api {post} /api/v1/service/bluetooth/config Save Bluetooth configuration
   * @apiName saveConfiguration
   * @apiGroup Bluetooth
   */
  async function saveConfiguration(req, res) {
    const config = await bluetoothManager.saveConfiguration(req.body);
    res.json(config);
  }

  return {
    'get /api/v1/service/bluetooth/status': {
      authenticated: true,
      controller: getStatus,
    },
    'get /api/v1/service/bluetooth/peripheral': {
      authenticated: true,
      controller: getDiscoveredDevices,
    },
    'get /api/v1/service/bluetooth/peripheral/bluetooth-:uuid': {
      authenticated: true,
      controller: getDiscoveredDevice,
    },
    'post /api/v1/service/bluetooth/presence': {
      authenticated: true,
      controller: scanPresence,
    },
    'get /api/v1/service/bluetooth/config': {
      authenticated: true,
      controller: getConfiguration,
    },
    'post /api/v1/service/bluetooth/config': {
      authenticated: true,
      controller: saveConfiguration,
    },
    'post /api/v1/service/bluetooth/scan': {
      authenticated: true,
      controller: scan,
    },
    'post /api/v1/service/bluetooth/scan/bluetooth-:uuid': {
      authenticated: true,
      controller: scanDevice,
    },
  };
};
