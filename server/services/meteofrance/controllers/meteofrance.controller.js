const logger = require('../../../utils/logger');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

// Official Météo France vigilance phenomenon ids (the warning API only returns ids)
const PHENOMENON_NAMES = {
  1: 'Vent violent',
  2: 'Pluie-inondation',
  3: 'Orages',
  4: 'Crues',
  5: 'Neige-verglas',
  6: 'Canicule',
  7: 'Grand froid',
  8: 'Avalanches',
  9: 'Vagues-submersion',
};

/**
 * @description Parse warning raw data and return filtered alerts array.
 * @param {object} warningData - Raw warning/full API response.
 * @param {string} dept - French department number.
 * @returns {Array} Filtered alert objects.
 */
function parseAlerts(warningData, dept) {
  const items = (warningData && warningData.phenomenons_items) || [];
  return items
    .filter((p) => p.phenomenon_max_color_id >= 2)
    .map((p) => ({
      dept,
      color: p.phenomenon_max_color_id,
      phenomene_id: parseInt(p.phenomenon_id, 10),
      phenomene_nom: PHENOMENON_NAMES[p.phenomenon_id] || `Phénomène ${p.phenomenon_id}`,
    }));
}

/**
 * @description Extract the vigilance bulletin text from warning data.
 * @param {object} warningData - Raw warning/full API response.
 * @returns {string} Bulletin text (empty string when not found).
 */
function parseVigilanceText(warningData) {
  const texts = [];
  // The bulletin structure varies: walk it and collect textual leaves under "text" keys
  const walk = (node) => {
    if (!node) {
      return;
    }
    if (typeof node === 'string') {
      if (node.trim()) {
        texts.push(node.trim());
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      Object.keys(node).forEach((key) => {
        if (key === 'text' || key === 'text_items') {
          walk(node[key]);
        } else if (typeof node[key] === 'object') {
          walk(node[key]);
        }
      });
    }
  };
  walk([warningData && warningData.text, warningData && warningData.text_avalanche]);
  return texts.join('\n');
}

/**
 * @description MeteoFrance service controllers.
 * @param {object} gladys - Gladys instance.
 * @param {Function} getVigilance - Vigilance fetch function.
 * @param {Function} getForecast - Forecast fetch function.
 * @param {Function} getVigilanceMap - Vigilance map fetch function (optional API key).
 * @returns {object} Controllers routes map.
 */
module.exports = function MeteoFranceController(gladys, getVigilance, getForecast, getVigilanceMap) {
  /**
   * @api {get} /api/v1/service/meteofrance/vigilance Get vigilance alerts
   */
  async function getVigilanceController(req, res) {
    const { dept } = req.query;
    if (!dept) {
      res.status(400).json({ message: 'DEPT_REQUIRED' });
      return;
    }
    const data = await getVigilance(dept);
    res.json({ alerts: parseAlerts(data, dept) });
  }

  /**
   * @api {get} /api/v1/service/meteofrance/vigilance/map Get national vigilance map image
   */
  async function getVigilanceMapController(req, res) {
    const image = await getVigilanceMap();
    if (!image) {
      res.status(404).json({ message: 'NO_API_KEY' });
      return;
    }
    res.json({ image });
  }

  /**
   * @api {get} /api/v1/house/:house_selector/meteofrance/weather Get Météo France weather for a house
   */
  async function getHouseWeatherController(req, res) {
    const houseSelector = req.params.house_selector;
    const vigilanceRequested = `${req.query.vigilance}` === 'true';

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

    // The department is derived from the house coordinates through the forecast response
    const dept = (forecastData.position && forecastData.position.dept) || null;
    let alerts = [];
    let text = '';
    if (vigilanceRequested && dept) {
      try {
        const warningData = await getVigilance(dept);
        alerts = parseAlerts(warningData, dept);
        if (alerts.length > 0) {
          text = parseVigilanceText(warningData);
        }
        logger.info(`[MeteoFrance] vigilance alerts parsed: ${alerts.length} for dept=${dept}`);
      } catch (e) {
        logger.warn(`[MeteoFrance] vigilance fetch failed for dept=${dept}: ${e.message}`);
      }
    }

    res.json({
      forecast: forecastData,
      vigilance: { alerts, dept, text },
    });
  }

  return {
    'get /api/v1/service/meteofrance/vigilance': {
      authenticated: true,
      controller: asyncMiddleware(getVigilanceController),
    },
    'get /api/v1/service/meteofrance/vigilance/map': {
      authenticated: true,
      controller: asyncMiddleware(getVigilanceMapController),
    },
    'get /api/v1/house/:house_selector/meteofrance/weather': {
      authenticated: true,
      controller: asyncMiddleware(getHouseWeatherController),
    },
  };
};
