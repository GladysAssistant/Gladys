const { BadParameters } = require('../../../utils/coreErrors');
const { transfromValueFromGladys } = require('./device/air-to-air.device');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const [prefix, topic] = deviceFeature.external_id.split(':');
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

  const newValue = transfromValueFromGladys(deviceFeature, value);

  const newDevice = {
    ...response,
    ...newValue,
    ...{
      HasPendingCommand: true,
    },
  };

  await this.client.post('/Device/SetAta', newDevice, {
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
}

module.exports = {
  setValue,
};
