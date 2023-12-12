const { expect } = require('chai');

const { readStates } = require('../../../../../services/ewelink/lib/features/binary');

describe('eWeLink binary feature -> readState', () => {
  it('should return empty states', () => {
    const states = readStates('ewelink-id', { currentTemperature: 17 });
    expect(states).deep.eq([]);
  });

  it('should return switch states', () => {
    const states = readStates('ewelink-id', { switch: 'on' });
    expect(states).deep.eq([{ featureExternalId: 'ewelink-id:binary:0', state: 1 }]);
  });

  it('should return switches states', () => {
    const states = readStates('ewelink-id', {
      switches: [
        { switch: 'on', outlet: 1 },
        { switch: 'off', outlet: 2 },
      ],
    });
    expect(states).deep.eq([
      { featureExternalId: 'ewelink-id:binary:1', state: 1 },
      { featureExternalId: 'ewelink-id:binary:2', state: 0 },
    ]);
  });
});
