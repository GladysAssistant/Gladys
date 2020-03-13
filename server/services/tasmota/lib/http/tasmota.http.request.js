const http = require('http');
const logger = require('../../../../utils/logger');

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
    // Authentication error
    if (res.statusCode >= 400 && res.statusCode <= 403) {
      logger.debug(`Tasmota: HTTP auth issue for ${url}: ${res.statusCode}`);
      authErrorCallback();
    } else if (res.statusCode >= 200 && res.statusCode < 400) {
      logger.debug(`Tasmota: HTTP waiting for data on ${url}`);

      res.on('data', (data) => {
        logger.debug(`Tasmota: HTTP success for ${url}`);
        dataCallback(data);
      });
    } else {
      logger.debug(`Tasmota: HTTP error for ${url}`);
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
};
