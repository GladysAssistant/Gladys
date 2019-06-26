const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function LocationController(gladys) {
  /**
   * @api {post} /api/v1/user/:user_selector/location create
   * @apiName create
   * @apiGroup Location
   * @apiParam {Number} latitude Latitude of the user
   * @apiParam {Number} longitude Longitude of the user
   * @apiParam {Number} altitude Altitude of the user
   * @apiParam {Number} accuracy Accuracy of the geolocation
   */
  async function create(req, res) {
    const newLocation = await gladys.location.create(req.params.user_selector, req.body);
    res.status(201).json(newLocation);
  }

  /**
   * @api {get} /api/v1/user/:user_selector/location get user locations
   * @apiName getLocationsUser
   * @apiGroup Location
   * @apiParam {string} [from="1 week ago"] - Start date
   * @apiParam {string} [to="now"] - End date
   * @apiSuccessExample {json} Success-Response
   * [
   *  {
   *   "id": "336a8517-b4af-4abe-8b03-28934d6fcf90",
   *   "user_id": "e4e3f03e-60b9-485e-bc0a-c582b69089bd",
   *   "latitude": 48,
   *   "longitude": 12,
   *   "altitude": 0,
   *   "accuracy": 20,
   *   "created_at": "2019-05-09T02:40:36.723Z",
   *   "updated_at": "2019-05-09T02:40:36.723Z"
   *  }
   * ]
   */
  async function getLocationsUser(req, res) {
    const locations = await gladys.location.get(req.params.user_selector, req.query.from, req.query.to);
    res.json(locations);
  }

  return Object.freeze({
    create: asyncMiddleware(create),
    getLocationsUser: asyncMiddleware(getLocationsUser),
  });
};
