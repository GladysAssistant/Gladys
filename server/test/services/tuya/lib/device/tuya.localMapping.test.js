/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const { expect } = require('chai');

const proxyquire = require('proxyquire')
  .noCallThru()
  .noPreserveCache();

const {
  addFallbackBinaryFeature,
  getLocalDpsFromCode,
} = require('../../../../../services/tuya/lib/device/tuya.localMapping');

describe('Tuya local mapping', () => {
  it('should return device when device is null', () => {
    const result = addFallbackBinaryFeature(null, { 1: true });
    expect(result).to.equal(null);
  });

  it('should return device when external_id is missing', () => {
    const device = { name: 'Device' };
    const result = addFallbackBinaryFeature(device, { 1: true });
    expect(result).to.equal(device);
  });

  it('should resolve aliases in strict local mapping', () => {
    const device = { device_type: 'air-conditioner' };
    const dpsKey = getLocalDpsFromCode('mode_eco', device);
    expect(dpsKey).to.equal(8);
  });

  it('should return null for unknown code in strict local mapping', () => {
    const device = { device_type: 'air-conditioner' };
    const dpsKey = getLocalDpsFromCode('unknown_code', device);
    expect(dpsKey).to.equal(null);
  });

  it('should fallback to switch dps in non-strict mapping without dps', () => {
    const { getLocalDpsFromCode: getLocalDpsFromCodeStub } = proxyquire(
      '../../../../../services/tuya/lib/device/tuya.localMapping',
      {
        '../mappings': {
          getDeviceType: () => 'unknown',
          getLocalMapping: () => ({ strict: false, codeAliases: {}, dps: {} }),
          normalizeCode: (code) => (code ? String(code).toLowerCase() : null),
        },
        './tuya.convertFeature': { convertFeature: () => null },
      },
    );
    const dpsKey = getLocalDpsFromCodeStub('switch', {});
    expect(dpsKey).to.equal(1);
  });
});
