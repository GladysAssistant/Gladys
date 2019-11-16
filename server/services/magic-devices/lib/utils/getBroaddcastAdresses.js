const os = require('os');
const logger = require('../../../../utils/logger');

function getBroadcastAdresses() {
    const interfaces = os.networkInterfaces();
    logger.info("==============================================");
    logger.info(interfaces);
    logger.info("==============================================");


    logger.info("==============================================");
    return interfaces;
}

module.exports = {
    getBroadcastAdresses,
  };
  