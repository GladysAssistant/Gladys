const { USER_ROLE } = require('../../utils/constants');

/**
 * @description Best-effort language for a synthesis that has no user behind
 * it (a scene announcement): the language of the first administrator — the
 * instance is set up in their language —, null when there is none yet. A
 * provider offering an "automatic" voice would otherwise fall back to its
 * own default language on every scene announcement.
 * @returns {Promise<string|null>} Resolve with a language code, or null.
 * @example
 * const language = await gladys.tts.getDefaultLanguage();
 */
async function getDefaultLanguage() {
  const admins = await this.user.getByRole(USER_ROLE.ADMIN);
  return (admins.length > 0 && admins[0].language) || null;
}

module.exports = {
  getDefaultLanguage,
};
