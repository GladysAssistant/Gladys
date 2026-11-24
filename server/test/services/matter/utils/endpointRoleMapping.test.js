const { expect } = require('chai');

const { getEndpointRole } = require('../../../../services/matter/utils/endpointRoleMapping');

const endpointWithTypes = (...codes) => ({ getDeviceTypes: () => codes.map((code) => ({ code })) });

describe('Matter.endpointRoleMapping', () => {
  it('should give the role of an outlet', () => {
    expect(getEndpointRole(endpointWithTypes(0x010a))).to.equal('outlet');
  });
  it('should give the role of the sensors', () => {
    expect(getEndpointRole(endpointWithTypes(0x0302))).to.equal('temperature');
    expect(getEndpointRole(endpointWithTypes(0x0307))).to.equal('humidity');
  });
  it('should skip the utility device types of a bridged device', () => {
    // bridged node + extended color light
    expect(getEndpointRole(endpointWithTypes(0x0013, 0x010d))).to.equal('light');
  });
  it('should prefer the main role to the electrical sensor of a plug', () => {
    expect(getEndpointRole(endpointWithTypes(0x0510, 0x010a))).to.equal('outlet');
    expect(getEndpointRole(endpointWithTypes(0x0510))).to.equal('energy');
  });
  it('should give no role when no device type has one', () => {
    expect(getEndpointRole(endpointWithTypes(0x0016, 0x0011))).to.equal(null);
    expect(getEndpointRole({ getDeviceTypes: () => [null] })).to.equal(null);
  });
  it('should give no role when the endpoint declares no device type', () => {
    expect(getEndpointRole({})).to.equal(null);
    expect(getEndpointRole({ getDeviceTypes: () => undefined })).to.equal(null);
    expect(getEndpointRole(undefined)).to.equal(null);
  });
});
