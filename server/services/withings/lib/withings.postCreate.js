const Promise = require('bluebird');

/**
 * @description Call a poll value of a withings device after device creation.
 * @param {object} device - The device to update value.
 * @returns {Promise} Resolve.
 * @example
 * postCreate(device);
 */
async function postCreate(device) {
  await this.poll(device);
}

module.exports = {
  postCreate,
};
