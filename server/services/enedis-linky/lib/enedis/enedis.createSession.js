const { NotFoundError } = require('../../../../utils/coreErrors');

const DEVICE_PARAM_LINKY_USAGE_POINT = 'LINKY_USAGE_POINT';

/**
 * @description Create session to.
 * @param {Object} device - Gladys user to clean up.
 * @returns {Promise} Resolving with authenticated session.
 * @example
 * createSession(device)
 */
async function createSession(device) {
  // find Linky usage point in the device
  const linkyUsagePointParam =
    device.params && device.params.find((param) => param.name === DEVICE_PARAM_LINKY_USAGE_POINT);
  if (!linkyUsagePointParam) {
    throw new NotFoundError('LINKY_USAGE_POINT_PARAM_NOT_FOUND');
  }
  if (!linkyUsagePointParam.value || linkyUsagePointParam.value.length === 0) {
    throw new NotFoundError('LINKY_USAGE_POINT_SHOULD_NOT_BE_EMPTY');
  }

  const ENEDIS_ACCESS_TOKEN = await this.gladys.variable.getValue('ENEDIS_ACCESS_TOKEN', this.serviceId);
  const ENEDIS_REFRESH_TOKEN = await this.gladys.variable.getValue('ENEDIS_REFRESH_TOKEN', this.serviceId);

  const session = new this.linky.Session({
    accessToken: ENEDIS_ACCESS_TOKEN,
    refreshToken: ENEDIS_REFRESH_TOKEN,
    usagePointId: linkyUsagePointParam.value,
    onTokenRefresh: async (accessToken, refreshToken) => {
      await this.gladys.variable.setValue('ENEDIS_ACCESS_TOKEN', accessToken, this.serviceId);
      await this.gladys.variable.getValue('ENEDIS_ACCESS_TOKEN', refreshToken, this.serviceId);
    },
  });

  return session;
}

module.exports = {
  createSession,
};
