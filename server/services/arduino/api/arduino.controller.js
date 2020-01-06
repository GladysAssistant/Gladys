module.exports = function ArduinoController({
  list
}) {
  /**
   * @api {get} /api/v1/service/serial/port List Serial ports
   * @apiName getSerialPorts
   * @apiGroup Serial
   */
  async function getSerialPorts(req, res) {
    const ports = await list();
    res.json(ports);
  }

  return {
    'get /api/v1/service/serial/port': {
      authenticated: true,
      controller: getSerialPorts,
    },
  };
};
