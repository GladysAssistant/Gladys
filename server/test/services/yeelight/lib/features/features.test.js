const { expect } = require('chai');
const features = require('../../../../../services/yeelight/lib/features');
const GladysColorDevice = require('../../mocks/gladys/color.json');
const GladysWhiteDevice = require('../../mocks/gladys/white.json');
const GladysUnhandledDevice = require('../../mocks/gladys/unhandled.json');
const yeelightColorDevice = require('../../mocks/yeelight/color.json');
const yeelightWhiteDevice = require('../../mocks/yeelight/white.json');
const yeelightUnhandledDevice = require('../../mocks/yeelight/unhandled.json');

describe('Yeelight features getExternalId', () => {
  it('returns externalId', () => {
    const externalId = features.getExternalId(yeelightColorDevice);
    expect(externalId).to.equal('yeelight:0x0000000000000001');
  });
});

describe('Yeelight features parseExternalId', () => {
  it('returns prefix, deviceId and type', () => {
    const { prefix, deviceId, type } = features.parseExternalId('yeelight:0x0000000000000000:type');
    expect(prefix).to.equal('yeelight');
    expect(deviceId).to.equal('0x0000000000000000');
    expect(type).to.equal('type');
  });
});

describe('Yeelight features getDevice', () => {
  it('returns device with power, brightness, color temperature and color features for a color model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', yeelightColorDevice);
    expect(device).to.deep.eq(GladysColorDevice);
  });
  it('returns device with power, brightness and color temperature features for a white model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', yeelightWhiteDevice);
    expect(device).to.deep.eq(GladysWhiteDevice);
  });
  it('returns device without features for an unhandled model', () => {
    const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', yeelightUnhandledDevice);
    expect(device).to.deep.eq(GladysUnhandledDevice);
  });
});
