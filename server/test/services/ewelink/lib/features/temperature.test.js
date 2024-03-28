const { expect } = require('chai');

const { readStates } = require('../../../../../services/ewelink/lib/features/temperature');

describe('eWeLink temperature feature -> readState', () => {
  it('should return empty states', () => {
    const states = readStates('ewelink-id', { switch: 'on' });
    expect(states).deep.eq([]);
  });

  it('should return temperature states', () => {
    const states = readStates('ewelink-id', { currentTemperature: 17 });
    expect(states).deep.eq([{ featureExternalId: 'ewelink-id:temperature', state: 17 }]);
  });
});
