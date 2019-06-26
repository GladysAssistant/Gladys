module.exports = function UsbController({ list }) {
  /**
   * @api {get} /api/v1/service/usb/port List USB ports
   * @apiName getUsbPorts
   * @apiGroup Usb
   */
  async function getUsbPorts(req, res) {
    const ports = await list();
    res.json(ports);
  }

  return {
    'get /api/v1/service/usb/port': {
      authenticated: true,
      controller: getUsbPorts,
    },
  };
};
