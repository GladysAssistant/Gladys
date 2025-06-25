const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const { STATUS, API } = require('./utils/tessie.constants');

/**
 * @description Connect to Tessie using API key.
 * @returns {Promise} Tessie connection status.
 * @example
 * connect();
 */
async function connect() {
  const { apiKey } = this.configuration;
  if (!apiKey) {
    await this.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });
    throw new ServiceNotConfiguredError('Tessie is not configured.');
  }
  await this.saveStatus({ statusType: STATUS.CONNECTING, message: null });
  logger.debug('Connecting to Tessie...');
  console.log('apiKey', apiKey);
  try {
    const response = await fetch(`${API.VEHICLES}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: API.HEADER.ACCEPT,
      },
    });

    if (response.status === 200) {
      const rawBody = await response.text();
      const parsedBody = JSON.parse(rawBody);
      const vehicles = parsedBody.results.map((vehicle) => ({
        vin: vehicle.vin,
        name: vehicle.last_state.vehicle_state?.vehicle_name,
        type: vehicle.last_state.vehicle_config?.car_type,
        specialType: vehicle.last_state.vehicle_config?.car_special_type,
        isActive: vehicle.is_active,
        vehicle,
      }));
      this.vehicles = vehicles;
      await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
      this.configured = true;

      // Démarrer le polling si des véhicules sont disponibles
      if (vehicles.length > 0) {
        await this.refreshTessieValues();
        await this.startPolling();

        // Initialiser les connexions WebSocket si activé
        if (this.configuration.websocketEnabled) {
          await this.initWebSocketConnections();
        }
      }

      return { vehicles };
    } else {
      throw new Error('Failed to connect to Tessie');
    }
  } catch (error) {
    await this.saveStatus({
      statusType: STATUS.ERROR.CONNECTING,
      message: error.message,
    });
    throw error;
  }
}

module.exports = {
  connect,
};
