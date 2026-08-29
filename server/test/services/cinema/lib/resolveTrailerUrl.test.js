const { expect } = require('chai');
const { resolveTrailerUrl } = require('../../../../services/cinema/lib/resolveTrailerUrl');

describe('resolveTrailerUrl', () => {
  it('should prefer a Trailer over a Teaser', () => {
    const videos = {
      results: [
        { site: 'YouTube', type: 'Teaser', official: true, key: 'teaser-key', published_at: '2026-01-01' },
        { site: 'YouTube', type: 'Trailer', official: true, key: 'trailer-key', published_at: '2026-01-01' },
      ],
    };
    expect(resolveTrailerUrl(videos)).to.equal('https://www.youtube.com/watch?v=trailer-key');
  });
  it('should prefer an official video over a non-official one of the same type', () => {
    const videos = {
      results: [
        { site: 'YouTube', type: 'Trailer', official: false, key: 'fan-key', published_at: '2026-01-01' },
        { site: 'YouTube', type: 'Trailer', official: true, key: 'official-key', published_at: '2025-01-01' },
      ],
    };
    expect(resolveTrailerUrl(videos)).to.equal('https://www.youtube.com/watch?v=official-key');
  });
  it('should prefer the most recently published video among equal candidates', () => {
    const videos = {
      results: [
        { site: 'YouTube', type: 'Trailer', official: true, key: 'older-key', published_at: '2025-01-01' },
        { site: 'YouTube', type: 'Trailer', official: true, key: 'newer-key', published_at: '2026-01-01' },
      ],
    };
    expect(resolveTrailerUrl(videos)).to.equal('https://www.youtube.com/watch?v=newer-key');
  });
  it('should ignore videos hosted outside YouTube', () => {
    const videos = { results: [{ site: 'Vimeo', type: 'Trailer', official: true, key: 'vimeo-key' }] };
    expect(resolveTrailerUrl(videos)).to.equal(null);
  });
  it('should ignore video types other than Trailer/Teaser', () => {
    const videos = { results: [{ site: 'YouTube', type: 'Clip', official: true, key: 'clip-key' }] };
    expect(resolveTrailerUrl(videos)).to.equal(null);
  });
  it('should return null when results is missing', () => {
    expect(resolveTrailerUrl({})).to.equal(null);
  });
  it('should return null when videos itself is missing', () => {
    expect(resolveTrailerUrl(undefined)).to.equal(null);
  });
});
