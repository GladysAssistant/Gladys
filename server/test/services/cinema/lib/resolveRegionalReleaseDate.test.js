const { expect } = require('chai');
const { resolveRegionalReleaseDate } = require('../../../../services/cinema/lib/resolveRegionalReleaseDate');

describe('resolveRegionalReleaseDate', () => {
  it('should return the earliest theatrical release date for the region', () => {
    const result = {
      results: [
        {
          iso_3166_1: 'US',
          release_dates: [{ type: 3, release_date: '2026-01-01T00:00:00.000Z' }],
        },
        {
          iso_3166_1: 'FR',
          release_dates: [
            { type: 3, release_date: '2026-09-16T00:00:00.000Z' },
            { type: 2, release_date: '2026-09-10T00:00:00.000Z' },
          ],
        },
      ],
    };
    expect(resolveRegionalReleaseDate(result, 'FR')).to.equal('2026-09-10');
  });
  it('should ignore non-theatrical release types (digital, physical, TV)', () => {
    const result = {
      results: [
        {
          iso_3166_1: 'FR',
          release_dates: [
            { type: 4, release_date: '2026-01-01T00:00:00.000Z' },
            { type: 3, release_date: '2026-09-16T00:00:00.000Z' },
          ],
        },
      ],
    };
    expect(resolveRegionalReleaseDate(result, 'FR')).to.equal('2026-09-16');
  });
  it('should return null when the region has no entry', () => {
    const result = { results: [{ iso_3166_1: 'US', release_dates: [{ type: 3, release_date: '2026-09-16' }] }] };
    expect(resolveRegionalReleaseDate(result, 'FR')).to.equal(null);
  });
  it('should return null when the region has no theatrical release', () => {
    const result = { results: [{ iso_3166_1: 'FR', release_dates: [{ type: 4, release_date: '2026-09-16' }] }] };
    expect(resolveRegionalReleaseDate(result, 'FR')).to.equal(null);
  });
  it('should return null when results is missing', () => {
    expect(resolveRegionalReleaseDate({}, 'FR')).to.equal(null);
  });
  it('should return null when the region matches but carries no release_dates field', () => {
    const result = { results: [{ iso_3166_1: 'FR' }] };
    expect(resolveRegionalReleaseDate(result, 'FR')).to.equal(null);
  });
});
