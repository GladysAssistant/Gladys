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

module.exports = function AreaController(gladys) {
  /**
   * @api {post} /api/v1/area create
   * @apiName create
   * @apiGroup Area
   * @apiUse AreaParam
   * @apiSuccessExample {json} Success-Response
   * {
   *   "id": "daff2ca0-5ab8-4e72-8561-c4ed9c7c6901",
   *   "name": "Home",
   *   "selector": "home",
   *   "latitude": 48,
   *   "longitude": 12,
   *   "radius": 100,
   *   "color": "#5042f4",
   *   "updated_at": "2019-05-09T03:11:03.819Z",
   *   "created_at": "2019-05-09T03:11:03.819Z"
   * }
   */
  async function create(req, res) {
    const area = await gladys.area.create(req.body);
    res.status(201).json(area);
  }

  /**
   * @api {patch} /api/v1/area/:area_selector update
   * @apiName update
   * @apiGroup Area
   * @apiUse AreaParam
   * @apiSuccessExample {json} Success-Response
   * {
   *   "id": "daff2ca0-5ab8-4e72-8561-c4ed9c7c6901",
   *   "name": "Home",
   *   "selector": "home",
   *   "latitude": 48,
   *   "longitude": 12,
   *   "radius": 100,
   *   "color": "#5042f4",
   *   "updated_at": "2019-05-09T03:11:03.819Z",
   *   "created_at": "2019-05-09T03:11:03.819Z"
   * }
   */
  async function update(req, res) {
    const area = await gladys.area.update(req.params.area_selector, req.body);
    res.json(area);
  }

  /**
   * @api {delete} /api/v1/area/:area_selector delete
   * @apiName delete
   * @apiGroup Area
   */
  async function destroy(req, res) {
    await gladys.area.destroy(req.params.area_selector);
    res.json({
      success: true,
    });
  }

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
    const areas = await gladys.area.get();
    res.json(areas);
  }

  /**
   * @api {get} /api/v1/area/:selector getBySelector
   * @apiName get
   * @apiGroup Area
   * @apiSuccessExample {json} Success-Response
   * {
   *   "id": "daff2ca0-5ab8-4e72-8561-c4ed9c7c6901",
   *   "name": "Home",
   *   "selector": "home",
   *   "latitude": 48,
   *   "longitude": 12,
   *   "radius": 100,
   *   "color": "#5042f4",
   *   "updated_at": "2019-05-09T03:11:03.819Z",
   *   "created_at": "2019-05-09T03:11:03.819Z"
   * }
   */
  async function getBySelector(req, res) {
    const area = await gladys.area.getBySelector(req.params.area_selector);
    res.json(area);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    destroy: asyncMiddleware(destroy),
    update: asyncMiddleware(update),
    get: asyncMiddleware(get),
    getBySelector: asyncMiddleware(getBySelector),
  });
};
