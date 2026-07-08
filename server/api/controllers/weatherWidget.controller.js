const logger = require('../../utils/logger');
const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { formatOpenWeatherAsMeteoFrance } = require('../../lib/weatherWidget/openweather.formatter');

/**
 * @description Weather widget controller: converts the OpenWeather forecast to the
 * Météo France widget format, so the "weather-meteo-france" widget can display either
 * source through the same rendering, picked per-widget instead of per-integration.
 * @param {any} gladys - Gladys instance.
 * @returns {object} Controller functions.
 */
module.exports = function WeatherWidgetController(gladys) {
  /**
   * @api {get} /api/v1/house/:house_selector/weather-widget/openweather Get OpenWeather forecast for the weather widget
   * @param {any} req - Express request.
   * @param {any} res - Express response.
   */
  async function getHouseOpenWeather(req, res) {
    const houseSelector = req.params.house_selector;
    const house = await gladys.house.getBySelector(houseSelector);
    if (house.latitude == null || house.longitude == null) {
      res.status(400).json({ message: 'HOUSE_HAS_NO_COORDINATES' });
      return;
    }

    const openweatherService = gladys.service.getService('openweather');
    if (openweatherService === null) {
      res.status(400).json({ message: ERROR_MESSAGES.SERVICE_NOT_CONFIGURED });
      return;
    }

    let forecastData;
    try {
      const { data, forecastData: rawForecast } = await openweatherService.weather.getRaw({
        latitude: house.latitude,
        longitude: house.longitude,
        language: req.user.language,
      });
      forecastData = formatOpenWeatherAsMeteoFrance(data, rawForecast);
    } catch (e) {
      const detail = e instanceof Error ? e.message : `${e}`;
      logger.warn(`[WeatherWidget] OpenWeather forecast failed: ${detail}`);
      res.status(502).json({ message: 'FORECAST_API_ERROR', detail });
      return;
    }

    res.json({
      source: 'openweather',
      house,
      forecast: forecastData,
      // OpenWeather has no vigilance alerts: keep the same response shape as Météo France
      vigilance: { alerts: [], dept: null, text: '' },
    });
  }

  return Object.freeze({
    getHouseOpenWeather: asyncMiddleware(getHouseOpenWeather),
  });
};
