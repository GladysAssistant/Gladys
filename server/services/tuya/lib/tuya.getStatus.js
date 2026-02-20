const { GLADYS_VARIABLES, STATUS } = require('./utils/tuya.constants');

/**
 * @description Get Tuya connection and configuration status.
 * @returns {Promise<object>} Status object.
 * @example
 * const status = await getStatus();
 */
async function getStatus() {
  const endpoint = await this.gladys.variable.getValue(GLADYS_VARIABLES.ENDPOINT, this.serviceId);
  const accessKey = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_KEY, this.serviceId);
  const secretKey = await this.gladys.variable.getValue(GLADYS_VARIABLES.SECRET_KEY, this.serviceId);
  const manualDisconnect = await this.gladys.variable.getValue(GLADYS_VARIABLES.MANUAL_DISCONNECT, this.serviceId);

  const configured = Boolean(endpoint && accessKey && secretKey);
  const manualDisconnectEnabled =
    manualDisconnect === true || manualDisconnect === 'true' || manualDisconnect === '1' || manualDisconnect === 1;

  return {
    status: this.status || STATUS.NOT_INITIALIZED,
    connected: this.status === STATUS.CONNECTED,
    configured,
    error: this.lastError,
    manual_disconnect: manualDisconnectEnabled,
  };
}

module.exports = {
  getStatus,
};
