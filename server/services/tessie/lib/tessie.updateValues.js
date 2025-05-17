const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, API } = require('./utils/tessie.constants');

/**
 * @description Update all vehicle values.
 * @returns {Promise} The result of the update.
 * @example
 * await updateValues();
 */
async function updateValues() {
  logger.debug('Updating Tessie vehicle values...');

  try {
    // Récupérer la liste des véhicules
    const response = await fetch(API.VEHICLES, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.configuration.apiKey}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        'Accept': API.HEADER.ACCEPT,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Tessie API error:', response.status, errorText);
      throw new Error(`Tessie API error: ${response.status}`);
    }

    const data = await response.json();
    const vehicles = data.results || [];

    // Mettre à jour chaque véhicule
    for (const vehicle of vehicles) {
      try {
        // Récupérer l'état du véhicule
        const stateResponse = await fetch(`${API.VEHICLES}/${vehicle.id}${API.VEHICLE_STATE}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.configuration.apiKey}`,
            'Content-Type': API.HEADER.CONTENT_TYPE,
            'Accept': API.HEADER.ACCEPT,
          },
        });

        if (!stateResponse.ok) {
          logger.error(`Error getting state for vehicle ${vehicle.id}:`, await stateResponse.text());
          continue;
        }

        const stateData = await stateResponse.json();

        // Mettre à jour les features dans Gladys
        const device = this.gladys.stateManager.get('deviceByExternalId', `tessie:${vehicle.id}`);
        if (device) {
          // Mettre à jour la batterie
          const batteryFeature = device.features.find(f => f.external_id === `tessie:${vehicle.id}:battery`);
          if (batteryFeature) {
            await this.gladys.stateManager.setState('deviceFeature', batteryFeature.selector, {
              value: stateData.battery_level,
            });
          }

          // Mettre à jour l'état de charge
          const chargingFeature = device.features.find(f => f.external_id === `tessie:${vehicle.id}:charging`);
          if (chargingFeature) {
            await this.gladys.stateManager.setState('deviceFeature', chargingFeature.selector, {
              value: stateData.charging_state === 'Charging' ? 1 : 0,
            });
          }

          // Mettre à jour les températures
          const insideTempFeature = device.features.find(f => f.external_id === `tessie:${vehicle.id}:inside_temp`);
          if (insideTempFeature) {
            await this.gladys.stateManager.setState('deviceFeature', insideTempFeature.selector, {
              value: stateData.inside_temp,
            });
          }

          const outsideTempFeature = device.features.find(f => f.external_id === `tessie:${vehicle.id}:outside_temp`);
          if (outsideTempFeature) {
            await this.gladys.stateManager.setState('deviceFeature', outsideTempFeature.selector, {
              value: stateData.outside_temp,
            });
          }

          // Mettre à jour l'état du véhicule
          const stateFeature = device.features.find(f => f.external_id === `tessie:${vehicle.id}:state`);
          if (stateFeature) {
            await this.gladys.stateManager.setState('deviceFeature', stateFeature.selector, {
              value: stateData.state,
            });
          }
        }
      } catch (e) {
        logger.error(`Error updating vehicle ${vehicle.id}:`, e);
      }
    }

    logger.debug('Tessie vehicle values updated successfully');
  } catch (e) {
    logger.error('Error updating Tessie vehicle values:', e);
    throw e;
  }
}

module.exports = {
  updateValues,
};
