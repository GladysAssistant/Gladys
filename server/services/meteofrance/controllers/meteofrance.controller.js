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
    .filter((v) => v.couleur >= 2 && (!dept || String(v.dep) === String(dept)))
    .map((v) => ({
      dept: v.dep,
      color: v.couleur,
      phenomene_id: v.phenomene_id,
      phenomene_nom: v.phenomene_nom,
    }));
}

/**
 * @description Extract the vigilance bulletin text for a department.
 * @param {object} textData - Raw textesvigilance API response.
 * @param {string} dept - French department number.
 * @returns {string} Bulletin text (empty string when not found).
 */
function parseVigilanceText(textData, dept) {
  const blocs = (textData && textData.product && textData.product.text_bloc_items) || [];
  const deptBlocs = blocs.filter((b) => String(b.domain_id) === String(dept));
  const texts = [];
  // The bulletin structure is deeply nested and loosely documented: walk it and collect "text" leaves
  const walk = (node) => {
    if (!node) {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      Object.keys(node).forEach((key) => {
        if (key === 'text' && Array.isArray(node[key])) {
          node[key].forEach((t) => {
            if (typeof t === 'string' && t.trim()) {
              texts.push(t.trim());
            }
          });
        } else {
          walk(node[key]);
        }
      });
    }
  };
  walk(deptBlocs);
  return texts.join('\n');
}

/**
 * @description MeteoFrance service controllers.
 * @param {object} gladys - Gladys instance.
 * @param {Function} getVigilance - Vigilance fetch function.
 * @param {Function} getForecast - Forecast fetch function.
 * @param {Function} getVigilanceText - Vigilance text bulletins fetch function.
 * @returns {object} Controllers routes map.
 */
module.exports = function MeteoFranceController(gladys, getVigilance, getForecast, getVigilanceText) {
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
        const vigilanceData = await getVigilance(dept);
        alerts = parseAlerts(vigilanceData, dept);
        logger.info(`[MeteoFrance] vigilance alerts parsed: ${alerts.length} for dept=${dept}`);
      } catch (e) {
        logger.warn(`[MeteoFrance] vigilance fetch failed for dept=${dept}: ${e.message}`);
      }
      if (alerts.length > 0) {
        try {
          const textData = await getVigilanceText();
          text = parseVigilanceText(textData, dept);
        } catch (e) {
          logger.warn(`[MeteoFrance] vigilance text fetch failed for dept=${dept}: ${e.message}`);
        }
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
    'get /api/v1/house/:house_selector/meteofrance/weather': {
      authenticated: true,
      controller: asyncMiddleware(getHouseWeatherController),
    },
  };
};
