const logger = require('../../../utils/logger');
const { MELCLOUD_HOME_API_ENDPOINT } = require('./utils/melcloud-home.constants');

/**
 * @description Load MELCloud Home air-to-air units from the /context endpoint.
 * @returns {Promise} List of air-to-air units (each annotated with its buildingId).
 * @example
 * await loadDevices();
 */
async function loadDevices() {
  const accessToken = await this.getAccessToken();

  const { data: context } = await this.client.get(`${MELCLOUD_HOME_API_ENDPOINT}/context`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const buildings = [...(context.buildings || []), ...(context.guestBuildings || [])];

  const units = [];
  buildings.forEach((building) => {
    (building.airToAirUnits || []).forEach((unit) => {
      units.push({
        ...unit,
        buildingId: building.id,
      });
    });
  });

  logger.debug(`${units.length} MELCloud Home air-to-air units loaded`);

  return units;
}

module.exports = {
  loadDevices,
};
