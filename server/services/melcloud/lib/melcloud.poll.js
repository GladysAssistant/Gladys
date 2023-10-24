const { BadParameters } = require('../../../utils/coreErrors');
const { EVENTS } = require('../../../utils/constants');
const { transfromValueFromMELCloud } = require('./device/air-to-air.device');

/**
 *
 * @description Poll values of an Tuya device.
 * @param {object} device - The device to poll.
 * @returns {Promise} Promise of nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  const externalId = device.external_id;
  const [prefix, topic] = device.external_id.split(':');

  if (prefix !== 'melcloud') {
    throw new BadParameters(`MELCloud device external_id is invalid: "${externalId}" should starts with "melcloud:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`MELCloud device external_id is invalid: "${externalId}" have no network indicator`);
  }

  const buildingId = device.params.find((param) => param.name === 'buildingID').value;

  const { data: response } = await this.client.get('/Device/Get', {
    params: { id: topic, buildingID: buildingId },
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:73.0) ',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'X-MitsContextKey': this.contextKey,
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: 'policyaccepted=true',
    },
  });

  device.features.forEach((deviceFeature) => {
    const value = transfromValueFromMELCloud(deviceFeature, response);

    if (deviceFeature.last_value !== value) {
      if (value !== null && value !== undefined) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: deviceFeature.external_id,
          state: value,
        });
      }
    }
  });
}

module.exports = {
  poll,
};
