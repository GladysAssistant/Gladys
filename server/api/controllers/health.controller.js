const asyncMiddleware = require('../middlewares/asyncMiddleware');
// const { Error400 } = require('../../utils/httpErrors');
// const { ERROR_MESSAGES } = require('../../utils/constants');

module.exports = function WeatherController(gladys) {
  /**
   * @api {get} /api/v1/user/:user_selector/health get health user
   * @apiName getWeatherUser
   * @apiGroup Weather
   * @apiSuccessExample {json} Success-Example
   * {
   *   "temperature": 27.28,
   *   "humidity": 0.58,
   *   "pressure": 1005.98,
   *   "datetime": "2019-05-09T04:26:42.000Z",
   *   "units": "metric",
   *   "wind_speed": 5.06,
   *   "health": "cloud"
   * }
   */
  async function getByUser(req, res) {
    const lastLocation = await gladys.location.getLast(req.params.user_selector);
    const options = {
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude,
      language: req.user.language,
    };
    const healthResult = await gladys.health.get(options);
    res.json(healthResult);
  }

  return Object.freeze({
    getByUser: asyncMiddleware(getByUser),
  });
};
