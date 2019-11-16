const os = require('os');
const logger = require('../../../../utils/logger');

function getBroadcastAdresses() {
    const interfaces = os.networkInterfaces();
    logger.info("==============================================");
    logger.info(interfaces);


    return interfaces;
}

module.exports = {
    getBroadcastAdresses,
  };
  