/**
 * @description Send Android TV shown code.
 * @param {string} deviceId - Gladys device id representing Android TV to connect.
 * @param {string} code - Code displayed on Android TV screen.
 * @returns {boolean} Success pairing.
 * @example
 * sendCode(deviceId, code)
 */
function sendCode(deviceId, code) {
  const androidTV = this.androidTVs[deviceId];

  if (androidTV) {
    return androidTV.sendCode(code);
  }

  return false;
}

module.exports = {
  sendCode,
};
