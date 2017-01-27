/**
 * @apiDefine WeatherSuccess
 * @apiSuccess {Float} temperature temperature
 * @apiSuccess {Float} humidity humidity
 * @apiSuccess {String} weather The code of the weather (rain, cloud)
 * @apiSuccess {Float} pressure pressure
 */

module.exports = {


    /**
     * @api {get} /weather get weather
     * @apiName GetWeather
     * @apiGroup Weather
     * @apiPermission authenticated
     *
     * @apiParam {Float} latitude The latitude where you want the weather
     * @apiParam {Float} longitude The longitude where you want the weather
     * @apiParam {Integer} [offset] (in hour) If you want to get the weather in the future
     *
     * @apiUse WeatherSuccess
     */
    get: function(req, res, next) {
        gladys.weather.get(req.query)
            .then(result => res.json(result))
            .catch(next);
    }
};