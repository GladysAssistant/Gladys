const { expect } = require('chai');
const { getEnercoopSeason } = require('../../../lib/french-calendar/french-calendar.getEnercoopSeason');

describe('French calendar - getEnercoopSeason', () => {
  it('should return summer between April and October', () => {
    expect(getEnercoopSeason(new Date('2025-04-01T12:00:00+02:00'), 'Europe/Paris')).to.equal('summer');
    expect(getEnercoopSeason(new Date('2025-07-15T12:00:00+02:00'), 'Europe/Paris')).to.equal('summer');
    expect(getEnercoopSeason(new Date('2025-10-31T12:00:00+01:00'), 'Europe/Paris')).to.equal('summer');
  });

  it('should return winter between November and March', () => {
    expect(getEnercoopSeason(new Date('2025-01-15T12:00:00+01:00'), 'Europe/Paris')).to.equal('winter');
    expect(getEnercoopSeason(new Date('2025-03-31T12:00:00+02:00'), 'Europe/Paris')).to.equal('winter');
    expect(getEnercoopSeason(new Date('2025-11-01T12:00:00+01:00'), 'Europe/Paris')).to.equal('winter');
  });
});
