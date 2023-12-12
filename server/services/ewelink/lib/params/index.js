const get = require('get-value');

const onlineParam = require('./online.param');
const firmwareParam = require('./firmware.param');

const PARAMS = [firmwareParam, onlineParam];

/**
 * @description Read device params from eWeLink device params.
 * @param {object} device - Key/value map with updated params.
 * @returns {Array} Array with all '{ name, value }' device params object.
 * @example
 * readParams({ online: true, params: { fwVersion: '2.5.0' } })
 */
function readParams(device) {
  const deviceParams = [];

  PARAMS.forEach(({ EWELINK_KEY_PATH, GLADYS_PARAM_KEY: name, convertValue = (value) => value }) => {
    const rawValue = get(device, EWELINK_KEY_PATH);
    if (rawValue !== undefined) {
      const value = convertValue(rawValue);
      deviceParams.push({ name, value });
    }
  });

  return deviceParams;
}

module.exports = {
  readParams,
};
