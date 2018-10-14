/**
 * @apiDefine DeviceStateSuccess
 * @apiSuccess {float} value The value of the state
 * @apiSuccess {datetime} datetime When the state occurred
 * @apiSuccess {integer} devicetype The deviceType
 */

/**
 * @apiDefine DeviceStateParam
 * @apiSuccess {float} value The value of the state
 * @apiSuccess {datetime} [datetime] When the state occurred
 * @apiSuccess {integer} devicetype The deviceType ID
 */

module.exports = {
  /**
   * @api {get} /devicestate get all deviceStates
   * @apiName getDeviceState
   * @apiGroup DeviceState
   * @apiPermission authenticated
   *
   * @apiParam {Integer} take the number of deviceState to return
   * @apiParam {Integer} skip the number of deviceState to skip
   *
   * @apiUse DeviceStateSuccess
   */
  index: function(req, res, next) {
    gladys.deviceState
      .get(req.query)
      .then(function(states) {
        return res.json(states);
      })
      .catch(next);
  },

  /**
   * @api {post} /devicestate create a deviceState
   * @apiName createDeviceState
   * @apiGroup DeviceState
   * @apiPermission authenticated
   *
   * @apiUse DeviceStateParam
   *
   * @apiUse DeviceStateSuccess
   */
  create: function(req, res, next) {
    gladys.deviceState
      .create(req.body)
      .then(state => res.status(201).json(state))
      .catch(next);
  },

  /**
   * @api {get} /devicestate/create create a deviceState (GET)
   * @apiName createDeviceStateGet
   * @apiGroup DeviceState
   * @apiPermission authenticated
   *
   * @apiUse DeviceStateParam
   *
   * @apiUse DeviceStateSuccess
   */
  createGet: function(req, res, next) {
    gladys.deviceState
      .create(req.query)
      .then(state => res.status(201).json(state))
      .catch(next);
  }
};
