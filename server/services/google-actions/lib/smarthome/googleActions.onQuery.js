const { queryDeviceConverter } = require('../utils/googleActions.queryDeviceConverter');

/**
 * @description The function that will run for an QUERY request.
 * It should return a valid response or a Promise that resolves to valid response.
 * @param {object} body - Request body.
 * @param {object} headers - Request headers.
 * @returns {Promise} A valid response.
 * @example
 * googleActions.onQuery({}, {});
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#onquery
 */
async function onQuery(body, headers) {
  // Get requested Gladys devices
  const devices = {};
  body.inputs
    .filter((input) => input.payload && input.payload.devices)
    .forEach((input) => {
      input.payload.devices.forEach((requestedDevice) => {
        const gladysDevice = this.gladys.stateManager.get('device', requestedDevice.id);

        // Convert it to managed Google devices
        const device = queryDeviceConverter(gladysDevice);
        if (device) {
          devices[gladysDevice.selector] = device;
        }
      });
    });

  return {
    requestId: body.requestId,
    payload: {
      agentUserId: body.user.id,
      devices,
    },
  };
}

module.exports = {
  onQuery,
};
