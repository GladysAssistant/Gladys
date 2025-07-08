const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { API, BASE_API, STATUS } = require('./utils/tessie.constants');

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

    const { charge_state: chargeState, drive_state: driveState } = vehicleState;
    if (
      chargeState.charging_state === 'Disconnected' && 
      driveState.shift_state === 'P' &&
      this.stateVehicle !== STATUS.VEHICLE_STATE.PARKING
    ) {
      this.stateVehicle = STATUS.VEHICLE_STATE.PARKING;
    } else if (chargeState.charging_state === 'Charging' && this.stateVehicle !== STATUS.VEHICLE_STATE.CHARGING) {
      this.stateVehicle = STATUS.VEHICLE_STATE.CHARGING;
    } else if (driveState.shift_state !== 'P' && this.stateVehicle !== STATUS.VEHICLE_STATE.DRIVING) {
      this.stateVehicle = STATUS.VEHICLE_STATE.DRIVING;
    }

    // Update features in Gladys
    if (device) {
      // Update battery
      await this.updateBattery(device, vehicleState, vin, externalId);

      // Update charge
      await this.updateCharge(device, vehicleState, vin, externalId);
      
      // Update climate
      await this.updateClimate(device, vehicleState, externalId);

      // Update command
      await this.updateCommand(device, vehicleState, externalId);

      // Update consumption
      await this.updateConsumption(device, vin, externalId);

        // Update drive
        await this.updateDrive(device, vehicleState, vin, externalId);

      // Update state
      await this.updateState(device, vehicleState, externalId);

    }
  } catch (e) {
    logger.error(`Error updating vehicle ${vehicle.id}:`, e);
  }

  logger.debug('Tessie vehicle values updated successfully');
}

module.exports = {
  updateValues,
};
