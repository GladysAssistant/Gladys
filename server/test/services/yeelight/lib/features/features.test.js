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
  [
    ['White', 'mono'],
    ['RGBW', 'color'],
    ['Stripe', 'stripe'],
    ['Ceiling', 'ceiling1'],
    ['Ceiling color', 'ceiling'],
    ['Bedside', 'bslamp1'],
    ['Bedside', 'bslamp'],
    ['Desklamp', 'desklamp'],
    ['Color', 'ct_bulb'],
  ].forEach(([modelName, model]) => {
    it(`returns "${modelName}" model name if model type is ${model}`, () => {
      const yeelightDevice = {
        id: '0x0000000000000000',
        model,
        capabilities: ['set_power'],
        port: 55443,
        host: '192.168.0.4',
      };
      const name = `Yeelight ${modelName}`;
      const GladysDevice = {
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name,
        model: `${modelName}`,
        external_id: 'yeelight:0x0000000000000000',
        selector: 'yeelight:0x0000000000000000',
        should_poll: true,
        poll_frequency: 30000,
        features: [
          {
            name: `${name} On/Off`,
            external_id: 'yeelight:0x0000000000000000:binary',
            selector: 'yeelight:0x0000000000000000:binary',
            category: 'light',
            type: 'binary',
            read_only: false,
            has_feedback: false,
            min: 0,
            max: 1,
          },
        ],
        params: [{ name: 'IP_ADDRESS', value: '192.168.0.4' }, { name: 'PORT_ADDRESS', value: 55443 }],
      };
      const device = features.getDevice('a810b8db-6d04-4697-bed3-c4b72c996279', yeelightDevice);
      expect(device).to.deep.eq(GladysDevice);
    });
  });
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
