const { expect } = require('chai');

const { pointInForce } = require('../../../../services/thermostat/lib/thermostat.getSchedules');

describe('thermostat.getSchedules pointInForce', () => {
  it('should resolve the point in force among the transitions given', async () => {
    // A single point is in force all week: the programme wraps onto it.
    const point = { day_of_week: 2, time: '22:00', preset: 'off' };

    expect(await pointInForce([point])).to.deep.equal(point);
  });

  it('should resolve no point on a programme with none', async () => {
    expect(await pointInForce([])).to.equal(null);
  });
});
