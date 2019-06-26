const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../utils/constants');

module.exports = function ServiceController(gladys) {
  /**
   * @api {post} /api/v1/service/:service_name/start start
   * @apiName start
   * @apiGroup Service
   * @apiSuccessExample {json} Success-Example
   * {
   *   "type": "service.start",
   *   "service": "mqtt",
   *   "status": "pending"
   * }
   */
  async function start(req, res) {
    const action = {
      type: ACTIONS.SERVICE.START,
      service: req.params.service_name,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {post} /api/v1/service/:service_name/stop stop
   * @apiName stop
   * @apiGroup Service
   * @apiSuccessExample {json} Success-Example
   * {
   *   "type": "service.stop",
   *   "service": "mqtt",
   *   "status": "pending"
   * }
   */
  async function stop(req, res) {
    const action = {
      type: ACTIONS.SERVICE.STOP,
      service: req.params.service_name,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {get} /api/v1/service/:service_name getByName
   * @apiName getByName
   * @apiGroup Service
   * @apiSuccessExample {json} Success-Example
   * {
   *  "id":"57ae1702-c071-483a-b532-384a507c1f04",
   *  "pod_id":null,
   *  "name":"rtsp-camera",
   *  "selector":"rtsp-camera",
   *  "version":"0.1.0",
   *  "enabled":true,
   *  "has_message_feature":false,
   *  "created_at":"2019-06-14T04:38:51.555Z",
   *  "updated_at":"2019-06-14T04:38:51.555Z"
   * }
   */
  async function getByName(req, res) {
    const service = await gladys.service.getByName(req.params.service_name, req.query.pod_id);
    res.json(service);
  }

  return Object.freeze({
    start: asyncMiddleware(start),
    stop: asyncMiddleware(stop),
    getByName: asyncMiddleware(getByName),
  });
};
