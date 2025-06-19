const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API, STATUS, PARAMS } = require('./utils/tessie.constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { writeValues } = require('./device/tessie.deviceMapping');

/**
 * @description Set a value to a Tessie vehicle feature.
 * @param {object} device - The device to control.
 * @param {object} feature - The feature to control.
 * @param {any} value - The value to set.
 * @returns {Promise} The result of the command.
 * @example
 * await setValue(device, feature, value);
 */
async function setValue(device, feature, value) {
  logger.debug(`Setting value ${value} to feature ${feature.selector} of device ${device.selector}`);

  const vehicleId = device.params.find((param) => param.name === 'vehicle_id')?.value;
  if (!vehicleId) {
    throw new Error('Vehicle ID not found in device params');
  }

  try {
    let endpoint = '';
    let body = {};

    // Déterminer la commande à envoyer en fonction du type de feature
    switch (feature.type) {
      case 'binary':
        if (feature.name === 'Charging State') {
          endpoint = `${API.VEHICLES}/${vehicleId}${API.VEHICLE_COMMAND}`;
          body = {
            command: value === 1 ? 'start_charging' : 'stop_charging',
          };
        }
        break;

      case 'enum':
        if (feature.name === 'Vehicle State') {
          endpoint = `${API.VEHICLES}/${vehicleId}${API.VEHICLE_COMMAND}`;
          switch (value) {
            case 'online':
              body = { command: 'wake' };
              break;
            case 'offline':
              body = { command: 'sleep' };
              break;
            default:
              throw new Error(`Unsupported vehicle state: ${value}`);
          }
        }
        break;

      default:
        throw new Error(`Unsupported feature type: ${feature.type}`);
    }

    if (!endpoint) {
      throw new Error(`No command endpoint found for feature: ${feature.name}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.configuration.apiKey}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Tessie API error:', response.status, errorText);
      throw new Error(`Tessie API error: ${response.status}`);
    }

    const result = await response.json();
    logger.debug(`Command executed successfully: ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    logger.error(`Error setting value to feature ${feature.selector}:`, e);
    throw e;
  }
}

module.exports = {
  setValue,
};
