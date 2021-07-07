const { NoValuesFoundError } = require('../../../../../utils/coreErrors');
const logger = require('../../../../../utils/logger');
const { PARAMS } = require('../../utils/broadlink.constants');

/**
 * @description Send IR code using Broadlink device.
 * @param {Object} peripheral - Broadlink peripheral.
 * @param {Object} device - Gladys device.
 * @param {Object} deviceFeature - Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * remoteHandler.setValue(peripheral, device, deviceFeature, 0);
 */
function setValue(peripheral, device, deviceFeature, value) {
  const { type } = deviceFeature;
  const valueStr = value.toString();

  const nbExpectedCodes = valueStr.length;
  const relatedParams = [];

  // Get all related params with code first
  for (let i = 0; i < nbExpectedCodes; i += 1) {
    const subValue = valueStr[i];
    const paramNames = [`${PARAMS.CODE}${type}`, `${PARAMS.CODE}${type}-${subValue}`];
    const param = device.params.find((p) => paramNames.includes(p.name));

    if (param) {
      relatedParams.push(param);
    }
  }

  if (nbExpectedCodes !== relatedParams.length) {
    throw new NoValuesFoundError(`No IR code found for ${type} feature and ${value} value`);
  }

  // Only if all exist, send them
  relatedParams.forEach((param) => {
    const { name, value: code } = param;
    logger.info(`Broadlink sending IR code for ${name} on ${peripheral.mac}`);

    const bufferCode = Buffer.from(code, 'hex');
    peripheral.sendData(bufferCode);
  });

  return null;
}

module.exports = {
  setValue,
};
