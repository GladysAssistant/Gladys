const deviceClasses = require('node-broadlink/dist/remote');
const Promise = require('bluebird');

const { NoValuesFoundError } = require('../../../../../utils/coreErrors');
const logger = require('../../../../../utils/logger');
const { PARAMS } = require('../../utils/broadlink.constants');

/**
 * @description Builds light Broadlink features.
 * @returns {Array} Empty array.
 * @example
 * buildFeatures();
 */
function buildFeatures() {
  return [];
}

/**
 * @description Send IR code using Broadlink device.
 * @param {object} broadlinkDevice - Broadlink device.
 * @param {object} gladysDevice - Gladys device.
 * @param {object} deviceFeature - Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @returns {Promise} Null.
 * @example
 * await setValue(broadlinkDevice, device, deviceFeature, 0);
 */
async function setValue(broadlinkDevice, gladysDevice, deviceFeature, value) {
  const { type } = deviceFeature;
  const valueStr = value.toString();

  // Check for valued code
  const valuedParamName = `${PARAMS.IR_CODE}${type}-${valueStr}`;
  const valuedParam = gladysDevice.params.find((p) => valuedParamName === p.name);
  const relatedParams = [];

  if (valuedParam) {
    relatedParams.push(valuedParam);
  } else {
    const nbExpectedCodes = valueStr.length;

    // Get all related params with code first
    for (let i = 0; i < nbExpectedCodes; i += 1) {
      const subValue = valueStr[i];
      const paramNames = [`${PARAMS.IR_CODE}${type}`, `${PARAMS.IR_CODE}${type}-${subValue}`];
      const param = gladysDevice.params.find((p) => paramNames.includes(p.name));

      if (param) {
        relatedParams.push(param);
      }
    }

    if (nbExpectedCodes !== relatedParams.length) {
      throw new NoValuesFoundError(`No IR code found for ${type} feature and ${value} value`);
    }
  }

  // Only if all exist, send them
  await Promise.each(relatedParams, async (param) => {
    const { name, value: code } = param;
    logger.info(`Broadlink sending IR code for ${name} on ${broadlinkDevice.mac.join(':')}`);

    const bufferCode = Buffer.from(code, 'hex');
    return broadlinkDevice.sendData(bufferCode);
  });

  return null;
}

module.exports = {
  deviceClasses,
  buildFeatures,
  setValue,
  canLearn: true,
};
