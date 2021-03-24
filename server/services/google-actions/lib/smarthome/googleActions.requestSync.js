const logger = require('../../../../utils/logger');

/**
 * @description Sends a request to the home graph to send a new SYNC request.
 * This should be called when a device is added or removed for a given user id.
 * @example
 * googleActions.requestsync();
 *
 * @see https://actions-on-google.github.io/actions-on-google-nodejs/interfaces/smarthome.smarthomeapp.html#requestsync
 */
async function requestSync() {
  Object.keys(this.userSmarthome).forEach((userSelector) => {
    this.userSmarthome[userSelector]
      .requestSync(userSelector)
      .then((res) => {
        logger.debug(`GoogleActions request SYNC is successful: ${res}`);
      })
      .catch((res) => {
        logger.error(`GoogleActions request SYNC is failure: ${res}`);
      });
  });
}

module.exports = {
  requestSync,
};
