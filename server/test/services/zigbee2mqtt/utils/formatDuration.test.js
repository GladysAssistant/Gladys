const { expect } = require('chai');

const { formatDuration } = require('../../../../services/zigbee2mqtt/utils/formatDuration');

describe('zigbee2mqtt formatDuration', () => {
  it('should format a duration under a second', () => {
    expect(formatDuration(0)).to.equal('0.0 s');
    expect(formatDuration(349)).to.equal('0.3 s');
  });

  it('should format a duration under a minute to the tenth of a second', () => {
    expect(formatDuration(12345)).to.equal('12.3 s');
    expect(formatDuration(59940)).to.equal('59.9 s');
  });

  it('should format a duration of a minute or more to the second', () => {
    expect(formatDuration(102400)).to.equal('1 min 42 s');
    expect(formatDuration(60000)).to.equal('1 min 0 s');
    expect(formatDuration(3725000)).to.equal('62 min 5 s');
  });

  it('should not show 60 seconds for a duration rounded up to a minute', () => {
    expect(formatDuration(59960)).to.equal('1 min 0 s');
  });
});
