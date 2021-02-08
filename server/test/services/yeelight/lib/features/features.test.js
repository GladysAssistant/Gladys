const { expect } = require('chai');
const features = require('../../../../../services/yeelight/lib/features');
const GladysColorDevice = require('../../mocks/Gladys-color.json');
const GladysWhiteDevice = require('../../mocks/Gladys-white.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const yeelightColorDevice = require('../../mocks/yeelight-color.json');
const yeelightWhiteDevice = require('../../mocks/yeelight-white.json');
const yeelightUnhandledDevice = require('../../mocks/yeelight-unhandled.json');

describe('Yeelight features getExternalId', () => {
  it('should return externalId', () => {
    const externalId = features.getExternalId(yeelightColorDevice);
    expect(externalId).to.equal('yeelight:0x00000000035ac142');
  });
});

describe('Yeelight features parseExternalId', () => {
  it('should return prefix, deviceId and type', () => {
    const { prefix, deviceId, type } = features.parseExternalId('yeelight:0x00000000035ac140:power');
    expect(prefix).to.equal('yeelight');
    expect(deviceId).to.equal('0x00000000035ac140');
    expect(type).to.equal('power');
  });
});

describe('Yeelight features getDevice', () => {
  it('should return device with power, brightness and color features for a color model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', yeelightColorDevice);
    expect(device).to.deep.eq(GladysColorDevice);
  });
  it('should return device with power and brightness features for a white model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', yeelightWhiteDevice);
    expect(device).to.deep.eq(GladysWhiteDevice);
  });
  it('should return device without features for an unhandled model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', yeelightUnhandledDevice);
    expect(device).to.deep.eq(GladysUnhandledDevice);
  });
});
