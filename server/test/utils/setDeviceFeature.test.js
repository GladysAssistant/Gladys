const { expect } = require('chai');
const { setDeviceFeature } = require('../../utils/setDeviceFeature');

describe('setDeviceFeature', () => {
  it('should create array and add feature', () => {
    const device = {};
    const feature = {
      selector: 'selector',
    };

    setDeviceFeature(device, feature);

    expect(device).deep.eq({
      features: [feature],
    });
  });

  it('should add feature to array', () => {
    const device = { features: [{ selector: 'no-match' }] };
    const feature = {
      selector: 'selector',
    };

    setDeviceFeature(device, feature);

    expect(device).deep.eq({
      features: [{ selector: 'no-match' }, feature],
    });
  });

  it('should replace feature into array', () => {
    const device = {
      features: [
        {
          selector: 'selector',
        },
      ],
    };
    const feature = {
      name: 'name',
      selector: 'selector',
    };

    setDeviceFeature(device, feature);

    expect(device).deep.eq({
      features: [feature],
    });
  });
});
