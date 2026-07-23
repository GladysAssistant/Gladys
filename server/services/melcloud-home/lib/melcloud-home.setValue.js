const { BadParameters, NotFoundError } = require('../../../utils/coreErrors');
const { MELCLOUD_HOME_API_ENDPOINT } = require('./utils/melcloud-home.constants');
const { buildFullPayload, transformValueFromGladys } = require('./device/air-to-air.device');

/**
 * @description Send the new device value over the MELCloud Home API.
 * The API expects a full command object, so the current state is fetched and the
 * changed attribute is overlaid on it before sending.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const [prefix, unitId] = externalId.split(':');

  if (prefix !== 'melcloud-home') {
    throw new BadParameters(
      `MELCloud Home device external_id is invalid: "${externalId}" should starts with "melcloud-home:"`,
    );
  }
  if (!unitId || unitId.length === 0) {
    throw new BadParameters(`MELCloud Home device external_id is invalid: "${externalId}" have no network indicator`);
  }

  const overlay = transformValueFromGladys(deviceFeature, value);
  if (overlay === null) {
    throw new BadParameters(`MELCloud Home device feature is not writable: "${externalId}"`);
  }

  const units = await this.loadDevices();
  const unit = units.find((currentUnit) => currentUnit.id === unitId);
  if (!unit) {
    throw new NotFoundError(`MELCloud Home unit not found: "${unitId}"`);
  }

  const payload = {
    ...buildFullPayload(unit),
    ...overlay,
  };

  const accessToken = await this.getAccessToken();

  await this.client.put(`${MELCLOUD_HOME_API_ENDPOINT}/monitor/ataunit/${unitId}`, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

module.exports = {
  setValue,
};
