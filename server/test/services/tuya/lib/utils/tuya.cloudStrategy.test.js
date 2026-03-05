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

  it('should resolve shadow strategy when thing model exposes additional supported codes', () => {
    const strategy = resolveCloudStrategy(
      {
        specifications: {
          functions: [{ code: 'switch' }, { code: 'temp_set' }, { code: 'mode' }, { code: 'fan_speed_enum' }],
          status: [{ code: 'switch' }, { code: 'temp_set' }, { code: 'temp_current' }, { code: 'mode' }],
        },
        thing_model: {
          services: [
            {
              properties: [
                { code: 'Power' },
                { code: 'temp_set' },
                { code: 'temp_current' },
                { code: 'mode' },
                { code: 'windspeed' },
                { code: 'horizontal' },
                { code: 'vertical' },
              ],
            },
          ],
        },
      },
      'air-conditioner',
    );

    expect(strategy).to.equal(CLOUD_STRATEGY.SHADOW);
  });

  it('should resolve shadow strategy when only thing model exposes supported codes', () => {
    const strategy = resolveCloudStrategy(
      {
        specifications: {
          functions: [],
          status: [],
        },
        thing_model: {
          services: [
            {
              properties: [{ code: 'switch_1' }],
            },
          ],
        },
      },
      'smart-socket',
    );

    expect(strategy).to.equal(CLOUD_STRATEGY.SHADOW);
  });

  it('should default configured strategy to legacy', () => {
    expect(getConfiguredCloudStrategy({ params: [] })).to.equal(CLOUD_STRATEGY.LEGACY);
  });
});
