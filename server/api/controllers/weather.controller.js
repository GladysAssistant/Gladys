const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

module.exports = function WeatherController(gladys) {
  /**
   * @api {get} /api/v1/user/:user_selector/weather get weather user
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
   *   "weather": "cloud"
   * }
   */
  async function getByUser(req, res) {
    const lastLocation = await gladys.location.getLast(req.params.user_selector);
    const options = {
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude,
      language: req.user.language,
      units: req.user.distance_unit_preference,
    };
    const weatherResult = await gladys.weather.get(options);
    res.json(weatherResult);
  }

  /**
   * @api {get} /api/v1/house/:house_selector/weather get weather house
   * @apiName getWeatherHouse
   * @apiGroup Weather
   * @apiSuccessExample {json} Success-Example
   * {
   *   "temperature": 27.28,
   *   "humidity": 0.58,
   *   "pressure": 1005.98,
   *   "datetime": "2019-05-09T04:26:42.000Z",
   *   "units": "metric",
   *   "wind_speed": 5.06,
   *   "weather": "cloud"
   * }
   */
  async function getByHouse(req, res) {
    const house = await gladys.house.getBySelector(req.params.house_selector);
    if (!house.latitude || !house.longitude) {
      throw new Error400(ERROR_MESSAGES.HOUSE_HAS_NO_COORDINATES);
    }
    const options = {
      latitude: house.latitude,
      longitude: house.longitude,
      language: req.user.language,
      units: req.user.distance_unit_preference,
    };
    const weatherResult = await gladys.weather.get(options);
    const responseWithHouseAndOptions = { ...weatherResult, house, options };
    res.json(responseWithHouseAndOptions);
  }

  return Object.freeze({
    getByHouse: asyncMiddleware(getByHouse),
    getByUser: asyncMiddleware(getByUser),
  });
};
