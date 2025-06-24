const logger = require('../../../../utils/logger');
const { STATUS } = require('../utils/tessie.constants');

async function disconnectAllWebSockets() {
    logger.debug('Disconnecting all WebSocket connections...');

    for (const [vin, ws] of this.websocketConnections) {
        try {
            ws.close();
            logger.debug(`WebSocket disconnected for VIN: ${vin}`);
        } catch (error) {
            logger.error(`Error disconnecting WebSocket for VIN ${vin}:`, error);
        }
    }

    this.websocketConnections.clear();
    await this.saveStatus({ statusType: STATUS.WEBSOCKET_DISCONNECTED, message: null });
}

module.exports = disconnectAllWebSockets; 