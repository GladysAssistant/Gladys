const YOUTUBE_WATCH_BASE_URL = 'https://www.youtube.com/watch?v=';
// Order matters: a real trailer is always preferred over a teaser.
const PREFERRED_VIDEO_TYPES = ['Trailer', 'Teaser'];

/**
 * @description Pick the best YouTube trailer/teaser out of a TMDB videos field.
 * @param {object} videos - The `videos` field of a TMDB movie details response.
 * @returns {string|null} The YouTube watch URL, or null if none was found.
 * @example
 * const trailerUrl = resolveTrailerUrl(movieDetails.videos);
 */
function resolveTrailerUrl(videos) {
  const results = (videos && videos.results) || [];
  const candidates = results.filter((video) => video.site === 'YouTube' && PREFERRED_VIDEO_TYPES.includes(video.type));
  if (candidates.length === 0) {
    return null;
  }
  const typeRank = (video) => PREFERRED_VIDEO_TYPES.indexOf(video.type);
  const [best] = [...candidates].sort((a, b) => {
    if (typeRank(a) !== typeRank(b)) {
      return typeRank(a) - typeRank(b);
    }
    if (Boolean(a.official) !== Boolean(b.official)) {
      return a.official ? -1 : 1;
    }
    return (b.published_at || '').localeCompare(a.published_at || '');
  });
  return `${YOUTUBE_WATCH_BASE_URL}${best.key}`;
}

module.exports = {
  resolveTrailerUrl,
};
