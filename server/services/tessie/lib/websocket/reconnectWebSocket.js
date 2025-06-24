const logger = require('../../../../utils/logger');

async function reconnectWebSocket(vin, apiKey) {
    logger.debug(`Attempting to reconnect WebSocket for VIN: ${vin}`);
    try {
        await this.connectWebSocket(vin, apiKey);
    } catch (error) {
        logger.error(`Failed to reconnect WebSocket for VIN ${vin}:`, error);
    }
}

module.exports = reconnectWebSocket; 