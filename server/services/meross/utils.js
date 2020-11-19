var md5 = require('md5');

/**
 * Generate Meross payload for toggle request.
 *
 * @param key - MerossKey.
 * @param onoff - On or off (1 or 0).
 * @returns {Object} JSON payload.
 * */
function merossTogglePayload(key, onoff) {
  const messageId = `messsage${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = md5(messageId + key + timestamp).toString();
  return {
    header: {
      from: '/app/gladys/subscribe',
      messageId: messageId,
      method: 'SET',
      namespace: 'Appliance.Control.ToggleX',
      payloadVersion: 1,
      sign: sign,
      timestamp: timestamp,
      triggerSrc: 'AndroidLocal',
    },
    payload: {
      togglex: {
        channel: 0,
        onoff: onoff,
      },
    },
  };
}

/**
 * Generate Meross payload for statze request.
 *
 * @param key - MerossKey.
 * @returns {Object} JSON payload.
 * */
function merossStatePayload(key) {
  const messageId = `messsage${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = md5(messageId + key + timestamp).toString();
  return {
    header: {
      from: '/app/gladys/subscribe',
      messageId: messageId,
      method: 'GET',
      namespace: 'Appliance.System.All',
      payloadVersion: 1,
      sign: sign,
      timestamp: timestamp,
      triggerSrc: 'AndroidLocal',
    },
    payload: {},
  };
}

module.exports = {
  md5,
  merossTogglePayload,
  merossStatePayload,
};
