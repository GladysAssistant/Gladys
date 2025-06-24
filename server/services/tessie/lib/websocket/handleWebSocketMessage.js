const logger = require('../../../../utils/logger');

async function handleWebSocketMessage(vin, message) {
    logger.debug(`Received WebSocket message for VIN ${vin}:`, message);
    logger.debug(`Received WebSocket message for VIN ${vin}:`, message.data);

    const externalId = `tessie:${vin}`;
    const device = await this.gladys.stateManager.get('deviceByExternalId', externalId);

    if (!device) {
        logger.warn(`Device not found for VIN ${vin}`);
        return;
    }

    try {
        if (message.data) {
            // Message de données de télémétrie
            await this.updateValuesFromWebSocket(device, message.data, externalId, vin);
        } else if (message.alerts) {
            // Message d'alertes
            // await this.handleAlerts(device, message.alerts, externalId, vin);
            logger.warn(`Alerts message for VIN ${vin}:`, message.alerts);
        } else if (message.connectionId) {
            // Message de connectivité
            logger.debug(`Connectivity message for VIN ${vin}: ${message.status}`);
        } else if (message.errors) {
            // Message d'erreurs
            logger.error(`WebSocket errors for VIN ${vin}:`, message.errors);
        }
    } catch (error) {
        logger.error(`Error handling WebSocket message for VIN ${vin}:`, error);
    }
}

module.exports = handleWebSocketMessage; 