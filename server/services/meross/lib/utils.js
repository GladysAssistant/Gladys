const md5 = require('md5');

/**
 * Generate Meross payload for toggle request.
 *
 * @description Generate Meross payload for toggle request.
 * @param {string} key - MerossKey.
 * @param {number} onoff - On or off (1 or 0).
 * @returns {Object} JSON payload.
 * @example merossTogglePayload('mykey', 0)
 * */
function merossTogglePayload(key, onoff) {
  const messageId = `messsage${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = md5(messageId + key + timestamp).toString();
  return {
    header: {
      from: '/app/gladys/subscribe',
      messageId,
      method: 'SET',
      namespace: 'Appliance.Control.ToggleX',
      payloadVersion: 1,
      sign,
      timestamp,
      triggerSrc: 'AndroidLocal',
    },
    payload: {
      togglex: {
        channel: 0,
        onoff,
      },
    },
  };
}

/**
 * Generate Meross payload for state request.
 * 
 * @description Generate Meross payload for state request.
 * @param {string} key - MerossKey.
 * @returns {Object} JSON payload.
 * @example merossStatePayload('mykey')
 * */
function merossStatePayload(key) {
  const messageId = `messsage${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = md5(messageId + key + timestamp).toString();
  return {
    header: {
      from: '/app/gladys/subscribe',
      messageId,
      method: 'GET',
      namespace: 'Appliance.System.All',
      payloadVersion: 1,
      sign,
      timestamp,
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
