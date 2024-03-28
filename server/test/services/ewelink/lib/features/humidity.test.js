const { expect } = require('chai');

const { readStates } = require('../../../../../services/ewelink/lib/features/humidity');

describe('eWeLink humidity feature -> readState', () => {
  it('should return empty states', () => {
    const states = readStates('ewelink-id', { switch: 'on' });
    expect(states).deep.eq([]);
  });

  it('should return humidity states', () => {
    const states = readStates('ewelink-id', { currentHumidity: 17 });
    expect(states).deep.eq([{ featureExternalId: 'ewelink-id:humidity', state: 17 }]);
  });
});
