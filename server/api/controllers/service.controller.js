const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function ServiceController(gladys) {
  /**
   * @api {post} /api/v1/service/:service_name/start start
   * @apiName start
   * @apiGroup Service
   * @apiSuccessExample {json} Success-Example
   * {
   *  "id":"57ae1702-c071-483a-b532-384a507c1f04",
   *  "pod_id":null,
   *  "name":"rtsp-camera",
   *  "selector":"rtsp-camera",
   *  "version":"0.1.0",
   *  "status":"RUNNING",
   *  "has_message_feature":false,
   *  "created_at":"2019-06-14T04:38:51.555Z",
   *  "updated_at":"2019-06-14T04:38:51.555Z"
   * }
   */
  async function start(req, res) {
    const service = await gladys.service.start(req.params.service_name);
    if (!service) {
      res.status(404);
    }
    res.json(service);
  }

  /**
   * @api {post} /api/v1/service/:service_name/stop stop
   * @apiName stop
   * @apiGroup Service
   * @apiSuccessExample {json} Success-Example
   * {
   *  "id":"57ae1702-c071-483a-b532-384a507c1f04",
   *  "pod_id":null,
   *  "name":"rtsp-camera",
   *  "selector":"rtsp-camera",
   *  "version":"0.1.0",
   *  "status":"STOPPED",
   *  "has_message_feature":false,
   *  "created_at":"2019-06-14T04:38:51.555Z",
   *  "updated_at":"2019-06-14T04:38:51.555Z"
   * }
   */
  async function stop(req, res) {
    const service = await gladys.service.stop(req.params.service_name, null, true);
    if (!service) {
      res.status(404);
    }
    res.json(service);
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
   *  "status":"RUNNING",
   *  "has_message_feature":false,
   *  "created_at":"2019-06-14T04:38:51.555Z",
   *  "updated_at":"2019-06-14T04:38:51.555Z"
   * }
   */
  async function getByName(req, res) {
    const service = await gladys.service.getByName(req.params.service_name, req.query.pod_id);
    res.json(service);
  }

  /**
   * @api {get} /api/v1/service getAll
   * @apiName getAll
   * @apiGroup Service
   * @apiSuccessExample {json} Success-Example
   * [
   *  {
   *   "id":"57ae1702-c071-483a-b532-384a507c1f04",
   *   "pod_id":null,
   *   "name":"rtsp-camera",
   *   "selector":"rtsp-camera",
   *   "version":"0.1.0",
   *   "status":"RUNNING",
   *   "has_message_feature":false,
   *   "created_at":"2019-06-14T04:38:51.555Z",
   *   "updated_at":"2019-06-14T04:38:51.555Z"
   *  },
   *  {
   *   "id": "25be132d-bc38-44c1-a240-2d2b72dd6bd9",
   *   "pod_id":null,
   *   "name":"bluetooth",
   *   "selector":"bluetooth",
   *   "version":"0.1.0",
   *   "status":"LOADING",
   *   "has_message_feature":false,
   *   "created_at":"2019-06-14T04:38:51.555Z",
   *   "updated_at":"2019-06-14T04:38:51.555Z"
   *  }
   * ]
   */
  async function getAll(req, res) {
    const service = await gladys.service.getAll(req.query.pod_id);
    res.json(service);
  }

  return Object.freeze({
    start: asyncMiddleware(start),
    stop: asyncMiddleware(stop),
    getByName: asyncMiddleware(getByName),
    getAll: asyncMiddleware(getAll),
  });
};
