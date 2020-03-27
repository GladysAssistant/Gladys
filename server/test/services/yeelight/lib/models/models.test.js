const { expect } = require('chai');
const models = require('../../../../../services/yeelight/lib/models');
const GladysColorDevice = require('../../mocks/Gladys-color.json');
const GladysWhiteDevice = require('../../mocks/Gladys-white.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const yeelightColorDevice = require('../../mocks/yeelight-color.json');
const yeelightWhiteDevice = require('../../mocks/yeelight-white.json');
const yeelightUnhandledDevice = require('../../mocks/yeelight-unhandled.json');

describe('Yeelight models getDevice', () => {
  it('should return device and features for a color model', () => {
    const model = 'color';
    const device = models[model].getDevice(yeelightColorDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysColorDevice);
  });
  it('should return device and features for a white model', () => {
    const model = 'white';
    const device = models[model].getDevice(yeelightWhiteDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysWhiteDevice);
  });
  it('should return device and features for an unhandled model', () => {
    const model = 'unhandled';
    const device = models[model].getDevice(yeelightUnhandledDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysUnhandledDevice);
  });
});
