const { expect } = require('chai');
const { isAssignedRegion } = require('../../../../services/tmdb/lib/isAssignedRegion');

describe('isAssignedRegion', () => {
  it('should accept a real ISO 3166-1 alpha-2 region', () => {
    expect(isAssignedRegion('FR')).to.equal(true);
    expect(isAssignedRegion('US')).to.equal(true);
    expect(isAssignedRegion('DE')).to.equal(true);
  });
  it('should reject a well-formed but unassigned/reserved code', () => {
    expect(isAssignedRegion('ZZ')).to.equal(false);
    expect(isAssignedRegion('XX')).to.equal(false);
  });
  it("should reject supra-national/grouping codes that resolve to a display name but aren't a TMDB region", () => {
    expect(isAssignedRegion('EU')).to.equal(false);
    expect(isAssignedRegion('UN')).to.equal(false);
    expect(isAssignedRegion('EZ')).to.equal(false);
  });
  it('should accept a legacy/transitional code TMDB still carries for older entries', () => {
    expect(isAssignedRegion('SU')).to.equal(true);
    expect(isAssignedRegion('YU')).to.equal(true);
  });
  it('should reject a value that is not exactly 2 uppercase letters', () => {
    expect(isAssignedRegion('fr')).to.equal(false);
    expect(isAssignedRegion('FRA')).to.equal(false);
    expect(isAssignedRegion('')).to.equal(false);
    expect(isAssignedRegion(undefined)).to.equal(false);
  });
});
