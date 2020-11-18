/**
 * @private
 * @description Turn on the plug.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @returns {Promise} Promise.
 * @example
 * turnOff(deviceFeature);
 */
function turnOff(device, deviceFeature) {
  const deviceUrlParam = device.params.find(param => param.name === 'CAMERA_URL');
  return this.client.post(`${deviceUrlParam.value}/config`, {
    "header": {
      "from": "/app/886482-7c2c1d631e1aabbf35808d714a2eb22a/subscribe",
      "messageId": "a4c3754627c920a8bfbe7ecd97616502",
      "method": "SET",
      "namespace": "Appliance.Control.ToggleX",
      "payloadVersion": 1,
      "sign": "6661b45211cdfe1ebfcbed5b2b16d4f3",
      "timestamp": 1605559233,
      "triggerSrc": "AndroidLocal"
    },
    "payload": {
      "togglex": {
        "channel": 0,
        "onoff": 0
      }
    }
  });
}

module.exports = turnOff;
