/**
 * @description Send Android TV shown code.
 * @param {string} deviceId - Gladys device id representing Android TV to connect.
 * @param {string} code - Code displayed on Android TV screen.
 * @returns {Promise} Success pairing.
 * @example
 * sendCode(deviceId, code)
 */
async function sendCode(deviceId, code) {
  const androidTV = this.androidTVs[deviceId];
  let result = false;

  if (androidTV) {
    try {
      result = androidTV.sendCode(code);
    } catch (error) {
      return false;
    }
    await this.gladys.device.setParam({ id: deviceId }, 'ANDROID_TV_PAIRED', result);
  }

  return result;
}

module.exports = {
  sendCode,
};
