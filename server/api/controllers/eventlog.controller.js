const asyncMiddleware = require('../middlewares/asyncMiddleware');

/**
 * @apiDefine AreaParam
 * @apiParam {String} name Name of the area.
 * @apiParam {String} [selector] Selector of the area.
 * @apiParam {Double} latitude Latitude of the center of the area.
 * @apiParam {Double} longitude Longitude of the center of the area.
 * @apiParam {Integer} radius Radius of the area in meter.
 * @apiParam {String} color Hexadecimal color of the area. (Ex: #00000)
 */

module.exports = function EventlogController(gladys) {

  /**
   * @api {get} /api/v1/area get
   * @apiName get
   * @apiGroup Area
   * @apiSuccessExample {json} Success-Response
   * [{
   *   "id": "daff2ca0-5ab8-4e72-8561-c4ed9c7c6901",
   *   "name": "Home",
   *   "selector": "home",
   *   "latitude": 48,
   *   "longitude": 12,
   *   "radius": 100,
   *   "color": "#5042f4",
   *   "updated_at": "2019-05-09T03:11:03.819Z",
   *   "created_at": "2019-05-09T03:11:03.819Z"
   * }]
   */
  async function get(req, res) {
    const logs = await gladys.eventlog.get();
    res.json(logs);
  }

  return Object.freeze({
    get: asyncMiddleware(get),
  });
};
