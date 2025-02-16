const logger = require('../../../../utils/logger');
const Nuki = require('nuki-web-api');
const { BadParameters } = require('../../../../utils/coreErrors');

/**
 * @description Scan for HTTP devices.
 * @returns {null} Return when scan started.
 * @example
 * nukiHTTPManager.scan();
 */
function scan() {
  logger.info(`Nuki : Scan for http devices`);
  let token = "4d9e1cf1e1b296bb80fd598f704f41b9946dc1be338af9728a138f552fed363df27346572b117411"
  let nuki = new Nuki(token)

  nuki.getSmartlocks().then(function(res) {
      console.log('getSmartlocks(): ' + JSON.stringify(res))

  }).catch(function(e) {console.error('getSmartlocks(): ' + e.message)});

  return null;
}

module.exports = {
  scan,
};
