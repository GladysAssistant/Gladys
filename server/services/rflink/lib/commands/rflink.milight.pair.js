const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description pair a milight device
 * @param {string} currentMilightGateway - Milight gateway.
 * @param {string} milightZone - Milight zone.
 * @example
 * rflink.pair()
 */
function pair(currentMilightGateway, milightZone) {
  let newLight;
  const number = milightZone;
  if (currentMilightGateway !== undefined) {
    // if (this.currentMilightGateway.number < 10) {
    //     number = `0${this.currentMilightGateway.number}`;
    // } else {
    //     number = `${this.currentMilightGateway.number}`;
    // }
    const msg = `10;MiLightv1;${this.currentMilightGateway};0${number};34BC;PAIR;`;
    this.sendUsb.write(msg, (error) => {});
    this.sendUsb.write(msg, (error) => {});
    this.sendUsb.write(msg, (error) => {});

    newLight = {
      service_id: this.serviceId,
      name: ` Milight ${currentMilightGateway} number${number} `,
      selector: `rflink:milight:${currentMilightGateway}:${number}`,
      external_id: `rflink:milight:${currentMilightGateway}:${number}`,
      model: `Milight`,
      should_poll: false,
      features: [
        {
          name: 'power',
          selector: `rflink:milight:${currentMilightGateway}:${number}:power`,
          external_id: `rflink:milight:${currentMilightGateway}:${number}:power`,
          rfcode: {
            value: 'CMD',
            cmd: 'ON',
          },
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 1,
        },
        {
          name: 'color',
          selector: `rflink:milight:${currentMilightGateway}:${number}:color`,
          external_id: `rflink:milight:${currentMilightGateway}:${number}:color`,
          rfcode: {
            value: 'RGBW',
            cmd: 'COLOR',
          },
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 255,
        },
        {
          name: 'brightness',
          selector: `rflink:milight:${currentMilightGateway}:${number}:brightness`,
          external_id: `rflink:milight:${currentMilightGateway}:${number}:brightness`,
          rfcode: {
            value: 'RGBW',
            cmd: 'BRIGHT',
          },
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        },
        {
          name: 'milight-mode',
          selector: `rflink:milight:${currentMilightGateway}:${number}:milight-mode`,
          external_id: `rflink:milight:${currentMilightGateway}:${number}:milight-mode`,
          rfcode: 'CMD',
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.MODE,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 1,
          max: 8,
        },
      ],
    };
    this.addNewDevice(newLight);
  }
}

module.exports = {
  pair,
};
