const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Command to send to Domoticz.
 * @param {any} client - Axios client.
 * @param {Object} params - Get parameters.
 * @example
 * domoticz.command('connect', {command: 'command'});
 */
async function command(client, params) {
  if (!client) {
    throw new ServiceNotConfiguredError('DOMOTICZ_NOT_CONNECTED');
  }

  let res = null;
  try {
    res = await client.get('json.htm', { params });
  } catch (err) {
    throw new ServiceNotConfiguredError('DOMOTICZ_CONNECT_ERROR');
  }

  if (res.data.status !== 'OK') {
    throw new ServiceNotConfiguredError('DOMOTICZ_RESPONSE_ERROR');
  }
  return res.data;
}

module.exports = {
  command,
};
