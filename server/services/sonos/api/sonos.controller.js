const Promise = require('bluebird');

module.exports = function SonosController(sonosMusicHandler) {
  /**
   * @api {get} /api/v1/service/sonos/device/live Get Sonos devices
   * @apiName GetDevices
   * @apiGroup Sonos
   */
  async function getDevices(req, res) {
    const devices = sonosMusicHandler.getDevices();
    const devicesFormatted = await Promise.map(devices, async (device) => {
      const { modelName, roomName, UDN } = await device.deviceDescription();
      return {
        udn: UDN,
        model_name: modelName,
        room_name: roomName,
        host: device.host,
      };
    });
    res.json(devicesFormatted);
  }

  return {
    'get /api/v1/service/sonos/device/live': {
      authenticated: true,
      controller: getDevices,
    },
  };
};
