module.exports = function BroadlinkController(broadlinkManager) {
  /**
   * @api {get} /api/v1/service/broadlink/peripheral Get discovered Broadlink peripherals.
   * @apiName getPeripheral
   * @apiGroup Broadlink
   */
  async function getPeripherals(req, res) {
    const peripherals = await broadlinkManager.getPeripherals();
    res.json(peripherals);
  }

  /**
   * @api {post} /api/v1/service/broadlink/learn Entering learn mode.
   * @apiName learn
   * @apiGroup Broadlink
   */
  async function learn(req, res) {
    await broadlinkManager.learn(req.body.peripheral);
    res.json({ learn: true });
  }

  /**
   * @api {post} /api/v1/service/broadlink/learn/cancel Leaving learn mode.
   * @apiName cancelLearn
   * @apiGroup Broadlink
   */
  async function cancelLearn(req, res) {
    await broadlinkManager.cancelLearn(req.body.peripheral);
    res.json({ cancelLearn: true });
  }

  /**
   * @api {post} /api/v1/service/broadlink/send Send code through peripheral.
   * @apiName send
   * @apiGroup Broadlink
   */
  async function send(req, res) {
    const { code, peripheral } = req.body;
    await broadlinkManager.send(peripheral, code);
    res.json({ send: true });
  }

  return {
    'get /api/v1/service/broadlink/peripheral': {
      authenticated: true,
      controller: getPeripherals,
    },
    'post /api/v1/service/broadlink/learn': {
      authenticated: true,
      controller: learn,
    },
    'post /api/v1/service/broadlink/learn/cancel': {
      authenticated: true,
      controller: cancelLearn,
    },
    'post /api/v1/service/broadlink/send': {
      authenticated: true,
      controller: send,
    },
  };
};
