const http = require('http');
const logger = require('../../../../utils/logger');

/**
 * @description Build URL from device.
 * @param {string} urlStr - URL as string.
 * @param {Object} device - Device.
 * @returns {string} The build URL.
 * @example
 * buildUrl('http://my-device');
 */
function buildUrl(urlStr, device = {}) {
  const url = new URL(urlStr);

  if (device && device.params) {
    const username = (device.params.find((param) => param.name === 'username') || {}).value;
    if (username) {
      url.username = username;

      const password = (device.params.find((param) => param.name === 'password') || {}).value;
      url.password = password;
    }
  }

  return url.href;
}

/**
 * @description Call HTTP Tasmota request over network.
 * @param {string} url - Tasmota URL to call.
 * @param {Function} dataCallback - Called if success.
 * @param {Function} authErrorCallback - Called if authentication error.
 * @param {Function} errorCallback - Called if error.
 * @example
 * request(
 *   'http://192.168.1.1/cm?cmnd=Status',
 *   (d) => console.log(d),
 *   () => console.log('auth error'),
 *   (error) => console.log(error)
 * );
 */
function request(url, dataCallback, authErrorCallback, errorCallback) {
  logger.debug(`Tasmota: HTTP looking for ${url}`);
  const req = http.get(url, (res) => {
    logger.debug(`Tasmota: HTTP response for ${url}: ${res.statusCode}`);

    // Authentication error
    if (res.statusCode >= 400 && res.statusCode <= 403) {
      authErrorCallback();
    } else if (res.statusCode >= 200 && res.statusCode < 400) {
      res.on('data', (data) => {
        const decodedMessage = JSON.parse(data);
        if (decodedMessage.WARNING) {
          logger.warn(`Tasmota: HTTP needs authentication for ${url}`);

          authErrorCallback();
        } else {
          dataCallback(data);
        }
      });
    } else {
      errorCallback();
    }
  });

  req.on('error', (e) => {
    logger.debug(`Tasmota: HTTP error for ${url}`);
    errorCallback(e);
  });

  req.end();

  return null;
}

module.exports = {
  request,
  buildUrl,
};
