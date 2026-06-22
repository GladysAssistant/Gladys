const logger = require('../../../utils/logger');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

/**
 * @description Parse vigilance raw data and return filtered alerts array.
 * @param {object} vigilanceData - Raw vigilance API response.
 * @returns {Array} Filtered alert objects.
 */
function parseAlerts(vigilanceData, dept) {
  const raw = (vigilanceData && vigilanceData.product && vigilanceData.product.liste_cours_valeur) || [];
  return raw
    .filter(v => v.couleur >= 2 && (!dept || String(v.dep) === String(dept)))
    .map(v => ({
      dept: v.dep,
      color: v.couleur,
      phenomene_id: v.phenomene_id,
      phenomene_nom: v.phenomene_nom,
    }));
}

/**
 * @description MeteoFrance service controllers.
 * @param {object} gladys - Gladys instance.
 * @param {Function} getVigilance - Vigilance fetch function.
 * @param {Function} getForecast - Forecast fetch function.
 * @returns {object} Controllers routes map.
 */
module.exports = function MeteoFranceController(gladys, getVigilance, getForecast) {
  /**
   * @api {get} /api/v1/service/meteofrance/vigilance Get vigilance alerts
   */
  async function getVigilanceController(req, res) {
    const { dept } = req.query;
    const data = await getVigilance(dept);
    res.json({ alerts: parseAlerts(data) });
  }

  /**
   * @api {get} /api/v1/house/:house_selector/meteofrance/weather Get Météo-France weather for a house
   */
  async function getHouseWeatherController(req, res) {
    const houseSelector = req.params['house_selector'];
    const { dept } = req.query;

    const house = await gladys.house.getBySelector(houseSelector);
    if (!house.latitude || !house.longitude) {
      res.status(400).json({ message: 'HOUSE_HAS_NO_COORDINATES' });
      return;
    }

    let forecastData;
    try {
      forecastData = await getForecast(house.latitude, house.longitude);
    } catch (e) {
      logger.warn(`[MeteoFrance] getForecast failed for (${house.latitude},${house.longitude}): ${e.message}`);
      res.status(502).json({ message: 'FORECAST_API_ERROR', detail: e.message });
      return;
    }

    let alerts = [];
    if (dept) {
      try {
        const vigilanceData = await getVigilance(dept);
        logger.debug(`[MeteoFrance] vigilance raw keys: ${JSON.stringify(Object.keys(vigilanceData || {}))}`);
        logger.debug(`[MeteoFrance] vigilance product keys: ${JSON.stringify(Object.keys((vigilanceData && vigilanceData.product) || {}))}`);
        alerts = parseAlerts(vigilanceData, dept);
        logger.info(`[MeteoFrance] vigilance alerts parsed: ${alerts.length} for dept=${dept}`);
      } catch (e) {
        logger.warn(`[MeteoFrance] vigilance fetch failed for dept=${dept}: ${e.message}`);
      }
    }

    res.json({
      forecast: forecastData,
      vigilance: { alerts },
    });
  }

  return {
    'get /api/v1/service/meteofrance/vigilance': {
      authenticated: true,
      controller: asyncMiddleware(getVigilanceController),
    },
    'get /api/v1/house/:house_selector/meteofrance/weather': {
      authenticated: true,
      controller: asyncMiddleware(getHouseWeatherController),
    },
  };
};
