const WebSocket = require('ws');
const logger = require('../../../utils/logger');
const { WEBSOCKET, STATUS } = require('./utils/tessie.constants');
const handleWebSocketMessage = require('./websocket/handleWebSocketMessage');
const updateValuesFromWebSocket = require('./websocket/updateValuesFromWebSocket');
const getWebSocketFeatureMapping = require('./websocket/getWebSocketFeatureMapping');
const parseWebSocketValue = require('./websocket/parseWebSocketValue');
const shouldUpdateFeature = require('./utils/shouldUpdateFeature');
const reconnectWebSocket = require('./websocket/reconnectWebSocket');
const disconnectAllWebSockets = require('./websocket/disconnectAllWebSockets');
const initWebSocketConnections = require('./websocket/initWebSocketConnections');

/**
 * @description Connect to Tessie WebSocket for a specific vehicle.
 * @param {string} vin - Vehicle VIN.
 * @param {string} apiKey - Tessie API key.
 * @returns {Promise<WebSocket>} WebSocket connection.
 * @example
 * await connectWebSocket('LRW3F7FR9NC123456', 'api_key_here');
 */
async function connectWebSocket(vin, apiKey) {
    const url = `${WEBSOCKET.BASE_URL}/${vin}?access_token=${apiKey}`;
    logger.debug(`Connecting to Tessie WebSocket for VIN: ${vin}`);

    await this.saveStatus({ statusType: STATUS.WEBSOCKET_CONNECTING, message: null });

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);

        ws.on('open', () => {
            logger.debug(`WebSocket connected for VIN: ${vin}`);
            this.websocketConnections.set(vin, ws);
            this.saveStatus({ statusType: STATUS.WEBSOCKET_CONNECTED, message: null });
            resolve(ws);
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleWebSocketMessage(vin, message);
            } catch (error) {
                logger.error(`Error parsing WebSocket message for VIN ${vin}:`, error);
            }
        });

        ws.on('error', (error) => {
            logger.error(`WebSocket error for VIN ${vin}:`, error);
            this.saveStatus({ statusType: STATUS.ERROR.WEBSOCKET, message: error.message });
            reject(error);
        });

        ws.on('close', (code, reason) => {
            logger.debug(`WebSocket closed for VIN ${vin}: ${code} - ${reason}`);
            this.websocketConnections.delete(vin);
            this.saveStatus({ statusType: STATUS.WEBSOCKET_DISCONNECTED, message: null });

            // Tentative de reconnexion si activé
            if (this.configuration.websocketEnabled) {
                setTimeout(() => {
                    this.reconnectWebSocket(vin, apiKey);
                }, WEBSOCKET.RECONNECT_INTERVAL);
            }
        });
    });
}

module.exports = {
    connectWebSocket,
    handleWebSocketMessage,
    updateValuesFromWebSocket,
    getWebSocketFeatureMapping,
    parseWebSocketValue,
    shouldUpdateFeature,
    reconnectWebSocket,
    disconnectAllWebSockets,
    initWebSocketConnections,
}; 