const W215 = require('../utils/w215');
const { parseExternalId } = require('../utils/parseExternalId');

const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { W215_PIN_CODE } = require('../../lib/utils/constants')

/**
 * @description Get connection status to validate pin code (success / failed).
 * @param {Object} device - The smart plug to poll.
 * @returns {Promise} Resolve with status.
 * @example
 * testConnection(device);
 */
async function testConnection(device) {
  return new Promise(async (resolve, reject) => {
    // we find the camera url in the device
    const pinCodeParam = device.params && device.params.find((param) => param.name === W215_PIN_CODE);
    if (!pinCodeParam) {
      return reject(new NotFoundError('PIN_CODE_PARAM_NOT_FOUND'));
    }
    // TODO : à refaire car la valeur par défaut du param n'est pas vide... Il faut donc tester vide + la valeur par défaut
    if (!pinCodeParam.value || pinCodeParam.value.length === 0) {
      return reject(new NotFoundError('PIN_CODE_SHOULD_BE_INFORMED'));
    }
    
    // deviceId is the outlet's IP adress
    const { outletIpAdress } = parseExternalId(device.external_id);
    
    const w215Switch = new W215(outletIpAdress, pinCodeParam);
    
    let connectionSuccess = false;

    w215Switch.login(function(loginStatus) {
        if (!loginStatus) {
            connectionSuccess = false;
            logger.debug(`w215 login error : admin / ${outletIpAdress} / ${pinCodeParam}, connection status = ${loginStatus}`);
        } else {
            connectionSuccess = true;
            logger.debug(`w215 login succes !`);
        }
    });
       
    return connectionSuccess;
  });
}

module.exports = {
    testConnection,
};
