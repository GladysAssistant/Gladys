const { expect } = require('chai');
const { getYeelightUnhandledLight } = require('../../../../../services/yeelight/lib/models/unhandled');
const GladysDevice = require('../../Gladys-unhandled.json');
const yeelightDevice = require('../../yeelight-unhandled.json');

describe('Yeelight - getYeelightUnhandledLight', () => {
  it('get device and features for an unhandled model', () => {
    const device = getYeelightUnhandledLight(yeelightDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysDevice);
  });
});
