const { expect } = require('chai');

const battery = require('../../../../../services/matter-bridge/lib/adapters/battery');
const { BAT_CHARGE_LEVEL } = require('../../../../../services/matter-bridge/lib/constants');
const { createMatter, feature, createContext } = require('../../fakes');

const level = feature('battery', 'battery', 'integer');

describe('Matter bridge battery adapter', () => {
  const matter = createMatter();

  it('should claim the first battery level', () => {
    expect(battery.claim([level, { ...level, selector: 'other' }])).to.deep.equal([{ level }]);
    expect(battery.claim([feature('x', 'battery-low', 'binary')])).to.deep.equal([]);
  });

  it('should build the battery power source', () => {
    expect(battery.behavior(matter).features).to.deep.equal(['Battery']);
    expect(battery.state({ level }, createContext({ battery: 50 })).powerSource).to.include({
      description: 'Battery',
      batPercentRemaining: 100,
      batChargeLevel: BAT_CHARGE_LEVEL.OK,
    });
    expect(battery.state({ level }, createContext({})).powerSource).to.include({ batPercentRemaining: null });
    expect(battery.toMatter('level', 5)).to.deep.equal({
      powerSource: { batPercentRemaining: 10, batChargeLevel: BAT_CHARGE_LEVEL.CRITICAL },
    });
  });

  it('should build a mains power source', () => {
    expect(battery.wiredBehavior(matter).features).to.deep.equal(['Wired']);
    expect(battery.wiredState().powerSource).to.include({ description: 'Mains' });
  });
});
