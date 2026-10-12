const { expect } = require('chai');
const {
  RANK,
  getEnergyRank,
  isEnergySourceFeature,
  getAttachmentFeatures,
  getMeterRootFeature,
  findLinkToCut,
  findCycle,
} = require('../../utils/energyHierarchy');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

const feature = (id, category, type, overrides = {}) => ({ id, category, type, device_id: 'device-a', ...overrides });
const index = (id, overrides) =>
  feature(id, DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX, overrides);
const consumption = (id, overrides) =>
  feature(
    id,
    DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    overrides,
  );
const cost = (id, overrides) =>
  feature(
    id,
    DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    overrides,
  );
const teleinfo = (id, type, overrides) => feature(id, DEVICE_FEATURE_CATEGORIES.TELEINFORMATION, type, overrides);

describe('energyHierarchy', () => {
  it('should rank the energy features', () => {
    expect(getEnergyRank(index('i'))).to.equal(RANK.INDEX);
    expect(getEnergyRank(teleinfo('e', DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST))).to.equal(RANK.INDEX);
    expect(
      getEnergyRank(
        feature('d', DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR, DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION),
      ),
    ).to.equal(RANK.CONSUMPTION);
    expect(getEnergyRank(cost('c'))).to.equal(RANK.COST);
    expect(getEnergyRank(feature('t', DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR, 'decimal'))).to.equal(RANK.OTHER);
    expect(isEnergySourceFeature(consumption('c'))).to.equal(true);
    expect(isEnergySourceFeature(cost('c'))).to.equal(false);
  });

  it('should list the attachment features of a device', () => {
    const device = {
      features: [
        index('meter-index'),
        consumption('meter-consumption', { energy_parent_id: 'meter-index' }),
        cost('meter-cost', { energy_parent_id: 'meter-consumption' }),
        index('sub-index', { energy_parent_id: 'feature-of-another-device' }),
      ],
    };
    expect(getAttachmentFeatures(device).map((f) => f.id)).to.deep.equal(['meter-index', 'sub-index']);
    expect(getAttachmentFeatures({})).to.deep.equal([]);
  });

  it('should pick the root feature of a meter', () => {
    // the total index of a Linky before its tariff bands, whatever the order of the features
    const linky = {
      features: [
        teleinfo('easf01', DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01),
        teleinfo('east', DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST),
        consumption('east_consumption', { energy_parent_id: 'east' }),
      ],
    };
    expect(getMeterRootFeature(linky).id).to.equal('east');
    // a derived consumption is never picked, an index is preferred to a consumption
    const meter = { features: [consumption('derived', { energy_parent_id: 'index' }), index('index')] };
    expect(getMeterRootFeature(meter).id).to.equal('index');
    // a supplier meter publishing its consumption itself
    expect(getMeterRootFeature({ features: [consumption('supplier')] }).id).to.equal('supplier');
    expect(getMeterRootFeature({ features: [cost('cost')] })).to.equal(null);
  });

  it('should cut the right link of a cycle', () => {
    const idx = index('index', { energy_parent_id: 'consumption' });
    const cons = consumption('consumption', { energy_parent_id: 'index' });
    // the index loses its parent, the derived consumption keeps its link
    expect(findLinkToCut([cons, idx])).to.equal(idx);
    expect(findLinkToCut([idx, cons])).to.equal(idx);
    // a self-reference
    const self = index('self', { energy_parent_id: 'self' });
    expect(findLinkToCut([self])).to.equal(self);
    // two indexes: the first one of the cycle
    const other = index('other', { device_id: 'device-b' });
    expect(findLinkToCut([idx, other])).to.equal(idx);
    // only the links of a device may be cut: its link is cut even when it goes "down"
    const costOnA = cost('cost-a');
    const indexOnB = index('index-b', { device_id: 'device-b' });
    expect(findLinkToCut([costOnA, indexOnB], (f) => f.device_id === 'device-a')).to.equal(costOnA);
    expect(findLinkToCut([costOnA, indexOnB], () => false)).to.equal(null);
    // among the links going "up", the one whose child has the highest rank
    const consumptionUp = consumption('c-up', { energy_parent_id: 'cost-up' });
    const costUp = cost('cost-up', { energy_parent_id: 'index-up' });
    const indexUp = index('index-up', { energy_parent_id: 'c-up' });
    expect(findLinkToCut([consumptionUp, costUp, indexUp])).to.equal(indexUp);
  });

  it('should find the cycle a feature belongs to', async () => {
    const features = new Map(
      [
        index('a', { energy_parent_id: 'b' }),
        consumption('b', { energy_parent_id: 'a' }),
        index('self', { energy_parent_id: 'self' }),
        cost('above', { energy_parent_id: 'a' }),
        cost('dangling', { energy_parent_id: 'unknown' }),
        cost('sound', { energy_parent_id: 'root' }),
        index('root'),
      ].map((f) => [f.id, f]),
    );
    const getFeature = async (id) => features.get(id) || null;
    expect((await findCycle(features.get('a'), getFeature)).map((f) => f.id)).to.deep.equal(['a', 'b']);
    expect((await findCycle(features.get('self'), getFeature)).map((f) => f.id)).to.deep.equal(['self']);
    // a cycle above a feature that is not part of it
    expect(await findCycle(features.get('above'), getFeature)).to.equal(null);
    expect(await findCycle(features.get('dangling'), getFeature)).to.equal(null);
    expect(await findCycle(features.get('sound'), getFeature)).to.equal(null);
  });
});
