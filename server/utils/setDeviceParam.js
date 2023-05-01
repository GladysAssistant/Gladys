/**
 * @description Add or update a param to a device.
 * @param {object} device - Device to add parameter.
 * @param {string} paramName - The key.
 * @param {any} paramValue - The value.
 * @returns {object} The device.
 * @example
 * setDeviceParam({params: []}, 'paramName', 'paramValue')
 */
function setDeviceParam(device, paramName, paramValue) {
  let { params } = device;
  if (!params) {
    params = [];
    device.params = params;
  }

  const param = params.find((p) => p.name === paramName);
  if (param) {
    param.value = paramValue;
  } else {
    params.push({ name: paramName, value: paramValue });
  }

  return device;
}

module.exports = {
  setDeviceParam,
};
