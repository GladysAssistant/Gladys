/* eslint-disable require-jsdoc, jsdoc/require-jsdoc */
const { expect } = require('chai');

const { addFallbackBinaryFeature } = require('../../../../../services/tuya/lib/device/tuya.localMapping');

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
});
