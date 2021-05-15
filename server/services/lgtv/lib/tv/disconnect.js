const logger = require('../../../../utils/logger');

const disconnect = function disconnect(device) {
  logger.info(`LGTV Disconnecting ${device.id}`);
  const connection = this.connections.get(device.external_id);

  if (!connection) {
    return;
  }

  connection.handler.disconnect();
  this.connections.delete(device.id);
  logger.info(`LGTV Disconnected ${device.external_id}`);
};

module.exports = disconnect;
