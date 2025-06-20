const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { API, BASE_API } = require('./utils/tessie.constants');

/**
 * @description Update all vehicle values.
 * @returns {Promise} The result of the update.
 * @example
 * await updateValues();
 */
async function updateValues(device, vehicle, externalId, vin) {
  logger.debug('Updating Tessie vehicle values...');

  try {
    // Get vehicle states
    const vehicleStateResponse = await fetch(`${BASE_API}/${vin}${API.VEHICLE_STATE}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.configuration.apiKey}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
    });

    if (vehicleStateResponse.status !== 200) {
      logger.error(`Error getting state for vehicle ${vin}:`, await vehicleStateResponse.text());
      return;
    }

    const vehicleState = await vehicleStateResponse.json();
    console.log('vehicleState', vehicleState);

    // Update features in Gladys
    if (device) {
      // Update battery
      await this.updateBattery(device, vehicleState, vin, externalId);

      // Update charge
      await this.updateCharge(device, vehicleState, vin, externalId);

      // Update climate
      await this.updateClimate(device, vehicleState, vin, externalId);

      // Update charging state
      // const chargingFeature = device.features.find(f => f.external_id === `${externalId}:charging`);
      // if (chargingFeature) {
      //   await this.gladys.stateManager.setState('deviceFeature', chargingFeature.selector, {
      //     value: stateData.charging_state === 'Charging' ? 1 : 0,
      //   });
      // }

      // // Update temperatures
      // const insideTempFeature = device.features.find(f => f.external_id === `${externalId}:inside_temp`);
      // if (insideTempFeature) {
      //   await this.gladys.stateManager.setState('deviceFeature', insideTempFeature.selector, {
      //     value: stateData.inside_temp,
      //   });
      // }

      // const outsideTempFeature = device.features.find(f => f.external_id === `${externalId}:outside_temp`);
      // if (outsideTempFeature) {
      //   await this.gladys.stateManager.setState('deviceFeature', outsideTempFeature.selector, {
      //     value: stateData.outside_temp,
      //   });
      // }

      // // Update vehicle state
      // const stateFeature = device.features.find(f => f.external_id === `${externalId}:state`);
      // if (stateFeature) {
      //   await this.gladys.stateManager.setState('deviceFeature', stateFeature.selector, {
      //     value: stateData.state,
      //   });
      // }
    }
  } catch (e) {
    logger.error(`Error updating vehicle ${vehicle.id}:`, e);
  }

  logger.debug('Tessie vehicle values updated successfully');
}

module.exports = {
  updateValues,
};
