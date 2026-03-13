const { expect } = require('chai');

const {
  CLOUD_STRATEGY,
  getConfiguredCloudStrategy,
  resolveCloudStrategy,
} = require('../../../../../services/tuya/lib/utils/tuya.cloudStrategy');

describe('Tuya cloud strategy utils', () => {
  it('should return null when cloud codes are invalid', () => {
    const strategy = resolveCloudStrategy(
      {
        specifications: {
          functions: [{ code: null }],
          status: [],
        },
      },
      'smart-socket',
    );

    expect(strategy).to.equal(null);
  });

  it('should resolve legacy strategy from specifications status', () => {
    const strategy = resolveCloudStrategy(
      {
        specifications: {
          functions: [],
          status: [{ code: 'switch_1' }],
        },
      },
      'smart-socket',
    );

    expect(strategy).to.equal(CLOUD_STRATEGY.LEGACY);
  });

  it('should default configured strategy to legacy', () => {
    expect(getConfiguredCloudStrategy({ params: [] })).to.equal(CLOUD_STRATEGY.LEGACY);
  });
});
