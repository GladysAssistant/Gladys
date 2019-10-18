const { expect } = require('chai');
const { getDeviceParam, setDeviceParam, getDeviceFeature } = require('../../utils/device');

const device = {
  features: [
    {
      id: 1,
      type: 'test',
      category: 'test',
    },
  ],
  params: [
    {
      name: 'MY_PARAM_1',
      value: 'MY_VALUE_1',
    },
    {
      name: 'MY_PARAM_2',
      value: 'MY_VALUE_2',
    },
  ],
};

describe('getDeviceParam', () => {
  it('should get a param', () => {
    const value = getDeviceParam(device, 'MY_PARAM_2');
    expect(value).to.equal('MY_VALUE_2');
  });
  it('should return null', () => {
    const value = getDeviceParam(device, 'DOES_NOT_EXIST');
    expect(value).to.equal(null);
  });
  it('should return null', () => {
    const value = getDeviceParam({}, 'MY_PARAM_2');
    expect(value).to.equal(null);
  });
});

describe('setDeviceParam', () => {
  it('should create a param', () => {
    const newDevice = {};
    setDeviceParam(newDevice, 'NAME', 'VALUE');
    expect(newDevice).to.deep.equal({
      params: [
        {
          name: 'NAME',
          value: 'VALUE',
        },
      ],
    });
  });
  it('should update param', () => {
    const newDevice = {
      params: [
        {
          name: 'EXISTING',
          value: 'OLD_VALUE',
        },
      ],
    };
    setDeviceParam(newDevice, 'EXISTING', 'NEW_VALUE');
    expect(newDevice).to.deep.equal({
      params: [
        {
          name: 'EXISTING',
          value: 'NEW_VALUE',
        },
      ],
    });
  });
});

describe('getDeviceFeature', () => {
  it('should get a feature', () => {
    const feature = getDeviceFeature(device, 'test', 'test');
    expect(feature).to.deep.equal({
      id: 1,
      type: 'test',
      category: 'test',
    });
  });
  it('should return null', () => {
    const value = getDeviceFeature(device, 'test', 'not-found');
    expect(value).to.equal(null);
  });
  it('should return null', () => {
    const value = getDeviceFeature(device, 'not-found', 'not-found');
    expect(value).to.equal(null);
  });
  it('should return null', () => {
    const value = getDeviceFeature({}, 'not-found', 'not-found');
    expect(value).to.equal(null);
  });
});
