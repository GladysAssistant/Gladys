const Promise = require('bluebird');
const dayjs = require('dayjs');

require('dayjs/locale/en');
require('dayjs/locale/fr');
require('dayjs/locale/de');

const LocalizedFormat = require('dayjs/plugin/localizedFormat');
const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, SERVICE_TYPES, USER_ROLE } = require('../../utils/constants');

dayjs.extend(LocalizedFormat);

/**
 * @description Resolve each service name's manifest display name. Only an
 * external integration has a t_service row to resolve (`tmdb`, the native
 * provider, has none): a provider with no resolvable label falls back to
 * its own technical name, kept honest rather than guessed.
 * @param {Array<string>} serviceNames - Service names to resolve.
 * @returns {Promise<Map<string, string>>} Service name -> display label.
 * @example
 * const labels = await resolveServiceLabels(['gladys-ugc']);
 */
async function resolveServiceLabels(serviceNames) {
  const rows = await db.Service.findAll({
    where: { type: SERVICE_TYPES.EXTERNAL, pod_id: null, name: serviceNames },
    attributes: ['name', 'manifest'],
  });
  return new Map(rows.map((row) => [row.name, (row.manifest && row.manifest.name) || row.name]));
}

/**
 * @description Resolve a language to format the release date in — this
 * event has no single recipient (a scene may message several users, each
 * with their own language), so it uses the first admin's language as a
 * reasonable household default, the same "no per-recipient context yet"
 * limitation `showtimesText` already accepts. Falls back to English when
 * there is no admin (a fresh, unconfigured instance).
 * @returns {Promise<string>} A 2-letter language code, e.g. "fr".
 * @example
 * const language = await resolveDisplayLanguage(); // "fr"
 */
async function resolveDisplayLanguage() {
  const admin = await db.User.findOne({ where: { role: USER_ROLE.ADMIN } });
  return (admin && admin.language) || 'en';
}

/**
 * @description Format a release date for display ("1 septembre 2026" in
 * French, "September 1, 2026" in English) using dayjs's localized long-date
 * format. An unparseable value is returned unchanged rather than dropped or
 * blanked — a provider's raw string is still better than nothing.
 * @param {string} releaseDate - The movie's `releaseDate` (B.19 point 3).
 * @param {string} language - A 2-letter language code, e.g. "fr".
 * @returns {string} The formatted date, or the original value if unparseable.
 * @example
 * formatReleaseDate('2026-09-01', 'fr'); // "1 septembre 2026"
 */
function formatReleaseDate(releaseDate, language) {
  const parsed = dayjs(releaseDate);
  return parsed.isValid() ? parsed.locale(language).format('LL') : releaseDate;
}

/**
 * @description Flatten a movie's showtimes into a single display string
 * ("14:00 VF, 16:35 VOST"), ready to drop into a one-line message template.
 * @param {Array<object>} [showtimes] - The movie's `showtimes` (B.19 point 7).
 * @returns {string} The flattened text, or an empty string when there is none.
 * @example
 * joinShowtimes([{ time: '14:00', version: 'VF' }]); // "14:00 VF"
 */
function joinShowtimes(showtimes) {
  if (!Array.isArray(showtimes) || showtimes.length === 0) {
    return '';
  }
  return showtimes
    .map((showtime) => (showtime.version ? `${showtime.time} ${showtime.version}` : showtime.time))
    .join(', ');
}

/**
 * @description The actual check, always called under the in-flight guard of checkNewReleases.
 * @returns {Promise} Resolves when every relevant provider has been checked.
 * @example
 * await runCheck.call(this);
 */
async function runCheck() {
  // a LIKE probe on the JSON column is dialect-dependent (sequelize
  // JSON-serializes the pattern): the trigger types are checked in JS on
  // the active scenes instead — a light query, ran at most twice a day
  const activeScenes = await db.Scene.findAll({
    where: { active: true },
    attributes: ['triggers'],
  });
  const relevantTriggers = [];
  activeScenes.forEach((scene) => {
    scene.triggers.forEach((trigger) => {
      if (trigger.type === EVENTS.MOVIES.NEW_RELEASE) {
        relevantTriggers.push(trigger);
      }
    });
  });
  if (relevantTriggers.length === 0) {
    return;
  }
  // shrink to only the providers actually referenced: a trigger with no
  // `movies_provider` is a wildcard, so its presence pulls every provider in
  const allProviders = this.getProviders();
  const hasWildcardTrigger = relevantTriggers.some((trigger) => !trigger.movies_provider);
  const providers = hasWildcardTrigger
    ? allProviders
    : allProviders.filter((providerName) =>
        relevantTriggers.some((trigger) => trigger.movies_provider === providerName),
      );
  if (providers.length === 0) {
    return;
  }
  const labelByName = await resolveServiceLabels(providers);
  const language = await resolveDisplayLanguage();
  await Promise.each(providers, async (providerName) => {
    let movies;
    try {
      // forwarded so a TMDB-backed provider returns titles/overviews in the
      // household's language instead of its own English default — there is
      // no trigger-level region, so a TMDB-backed trigger still watches the
      // provider's own default region (France); a cinema-timetable provider
      // ignores an option it doesn't recognize
      movies = await this.getUpcoming({ service: providerName, language });
    } catch (e) {
      // provider not configured, or a real failure: nothing to diff, the
      // previous baseline is kept so recovery does not re-fire scenes
      logger.debug(`premieres.checkNewReleases: no movies for provider ${providerName}: ${e.message}`);
      return;
    }
    const currentIds = new Set(movies.map((movie) => String(movie.id)));
    const knownIds = this.providerMovieIds.get(providerName);
    // the first poll of a provider is a baseline: no events, so a core
    // restart never re-fires scenes for movies that were already listed
    if (knownIds === undefined) {
      this.providerMovieIds.set(providerName, currentIds);
      return;
    }
    movies.forEach((movie) => {
      const id = String(movie.id);
      if (knownIds.has(id)) {
        return;
      }
      this.event.emit(EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.MOVIES.NEW_RELEASE,
        service: providerName,
        serviceLabel: labelByName.get(providerName) || providerName,
        movie: {
          title: movie.title,
          releaseDate: formatReleaseDate(movie.releaseDate, language),
          sourceUrl: movie.sourceUrl,
          trailerUrl: movie.trailerUrl,
          showtimesText: joinShowtimes(movie.showtimes),
        },
      });
    });
    // the baseline is cumulative ("ever seen"), not just the last poll: a
    // provider limited to a single page (TMDB's discover, 20 titles) can
    // drop an id off its visible window as sorting shifts, then show it
    // again later — merging into the existing Set (not replacing it) keeps
    // that reappearance from firing the trigger a second time
    currentIds.forEach((id) => knownIds.add(id));
  });
}

/**
 * @description Poll every provider referenced by an active `movies.new-release`
 * trigger and diff its upcoming list against the previous poll, firing the
 * trigger for each newly-appeared movie id. Runs twice a day (scheduler job
 * check-movies-new-releases): a release calendar changes far less often than
 * weather. Gated: no active scene with a movies.new-release trigger means
 * zero third-party calls.
 * @returns {Promise} Resolves when every relevant provider has been checked.
 * @example
 * await premieres.checkNewReleases();
 */
async function checkNewReleases() {
  // the scheduled job could in principle overlap a slow previous run on a
  // large deployment: a run already in flight wins, matching weather's doctrine
  if (this.checkNewReleasesRunning) {
    return;
  }
  this.checkNewReleasesRunning = true;
  try {
    await runCheck.call(this);
  } finally {
    this.checkNewReleasesRunning = false;
  }
}

module.exports = {
  checkNewReleases,
};
