const { expect } = require('chai');

const {
  CLOUD_STRATEGY,
  getConfiguredCloudStrategy,
  resolveCloudStrategy,
} = require('../../../../../services/tuya/lib/utils/tuya.cloudStrategy');
const { DEVICE_TYPES } = require('../../../../../services/tuya/lib/mappings');

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

  it('should ignore empty cloud codes and return no strategy', () => {
    const strategy = resolveCloudStrategy(
      {
        specifications: {
          status: [{ code: '' }],
        },
        thing_model: {
          services: [{ properties: [{ code: '   ' }] }],
        },
      },
      DEVICE_TYPES.SMART_SOCKET,
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
