const { expect } = require('chai');
const { isAssignedRegion } = require('../../../../services/cinema/lib/isAssignedRegion');

describe('isAssignedRegion', () => {
  it('should accept a real ISO 3166-1 alpha-2 region', () => {
    expect(isAssignedRegion('FR')).to.equal(true);
    expect(isAssignedRegion('US')).to.equal(true);
    expect(isAssignedRegion('DE')).to.equal(true);
  });
  it('should reject the reserved "unknown region" code', () => {
    expect(isAssignedRegion('ZZ')).to.equal(false);
  });
  it('should reject a well-formed but unassigned code', () => {
    expect(isAssignedRegion('XX')).to.equal(false);
  });
  it('should reject a value that is not exactly 2 uppercase letters', () => {
    expect(isAssignedRegion('fr')).to.equal(false);
    expect(isAssignedRegion('FRA')).to.equal(false);
    expect(isAssignedRegion('')).to.equal(false);
    expect(isAssignedRegion(undefined)).to.equal(false);
  });
});
