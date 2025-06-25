const logger = require('../../../../utils/logger');

async function initWebSocketConnections() {
    logger.debug('Initializing WebSocket connections for all vehicles...');

    if (!this.configuration.websocketEnabled || !this.configuration.apiKey) {
        logger.debug('WebSocket is disabled or API key not configured');
        return;
    }

    for (const vehicle of this.vehicles) {
        try {
            await this.connectWebSocket(vehicle.vin, this.configuration.apiKey);
        } catch (error) {
            logger.error(`Failed to connect WebSocket for VIN ${vehicle.vin}:`, error);
        }
    }
}

module.exports = initWebSocketConnections; 