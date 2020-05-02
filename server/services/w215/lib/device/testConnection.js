const W215 = require('../utils/w215');
const { parseExternalId } = require('../utils/parseExternalId');

const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { W215_PIN_CODE } = require('../../lib/utils/constants');

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
    // pin code must be informed by user and default value is not usable
    if (
      !pinCodeParam.value ||
      pinCodeParam.value.length === 0 ||
      pinCodeParam.value.length === 'See behind the outlet'
    ) {
      return reject(new NotFoundError('PIN_CODE_SHOULD_BE_INFORMED'));
    }

    // deviceId is the outlet's IP adress
    const { outletIpAdress } = parseExternalId(device.external_id);

    const w215Switch = new W215(outletIpAdress, pinCodeParam.value);

    let connectionSuccess = false;

    w215Switch.login(function(loginStatus) {
      logger.debug(`Test connection : ${loginStatus}`);
      if (loginStatus === 'failed') {
        connectionSuccess = false;
        logger.debug(
          `w215 login error : admin / ${outletIpAdress} / ${pinCodeParam.value}, connection status = ${loginStatus}`,
        );
      } else if (loginStatus === 'success') {
        connectionSuccess = true;
        logger.debug(`w215 login success !`);
      } else {
        connectionSuccess = false;
        logger.debug(
          `w215 login error : admin / ${outletIpAdress} / ${pinCodeParam.value}, connection status = ${loginStatus}`,
        );
      }
      resolve(connectionSuccess);
    });

    return null;
  });
}

module.exports = {
  testConnection,
};
