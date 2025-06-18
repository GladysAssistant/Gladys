const Promise = require('bluebird');
const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API } = require('./utils/tessie.constants');

/**
 * @description Load Tessie vehicles.
 * @returns {Promise} List of vehicles.
 * @example
 * await loadVehicles();
 */
async function loadVehicles() {
  logger.debug('Loading Tessie vehicles...');
  let vehicles = [];

  try {
    const response = await fetch(API.VEHICLES, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.configuration.apiKey}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Tessie API error:', response.status, errorText);
      throw new Error(`Tessie API error: ${response.status}`);
    }

    const data = await response.json();
    vehicles = data.results || [];

    // // Load additional details for each vehicle
    // vehicles = await Promise.all(
    //   vehicles.map(async (vehicle) => {
    //     try {
    //       const stateResponse = await fetch(`${API.VEHICLES}/${vehicle.vin}/${API.VEHICLE_STATE}`, {
    //         method: 'GET',
    //         headers: {
    //           Authorization: `Bearer ${this.configuration.apiKey}`,
    //           'Content-Type': API.HEADER.CONTENT_TYPE,
    //           Accept: API.HEADER.ACCEPT,
    //         },
    //       });

    //       if (stateResponse.ok) {
    //         const stateData = await stateResponse.json();
    //         return {
    //           ...vehicle,
    //           state: stateData,
    //         };
    //       }
    //     } catch (e) {
    //       logger.error(`Error loading state for vehicle ${vehicle.id}:`, e);
    //     }
    //     return vehicle;
    //   })
    // );

    logger.debug(`${vehicles.length} Tessie vehicles loaded`);
    return vehicles;
  } catch (e) {
    logger.error('Error loading Tessie vehicles:', e);
    throw e;
  }
}

module.exports = {
  loadVehicles,
};
