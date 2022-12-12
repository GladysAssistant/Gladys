const { expect } = require('chai');
const { setDeviceParam } = require('../../utils/setDeviceParam');

describe('setDeviceParam', () => {
  it('should create array and add param', () => {
    const device = {};
    const paramName = 'name';
    const paramValue = 'value';

    setDeviceParam(device, paramName, paramValue);

    expect(device).deep.eq({
      params: [{ name: 'name', value: 'value' }],
    });
  });

  it('should add param to array', () => {
    const device = {
      params: [{ name: 'no-match', value: 'value' }],
    };
    const paramName = 'name';
    const paramValue = 'value';

    setDeviceParam(device, paramName, paramValue);

    expect(device).deep.eq({
      params: [
        { name: 'no-match', value: 'value' },
        { name: 'name', value: 'value' },
      ],
    });
  });

  it('should replace param into array', () => {
    const device = {
      params: [
        {
          name: 'name',
          value: 'old_value',
        },
      ],
    };
    const paramName = 'name';
    const paramValue = 'new_value';

    setDeviceParam(device, paramName, paramValue);

    expect(device).deep.eq({
      params: [{ name: 'name', value: 'new_value' }],
    });
  });
});
