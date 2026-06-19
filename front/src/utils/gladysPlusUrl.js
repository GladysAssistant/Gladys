const GLADYS_PLUS_LANDING_BASE_URL = 'https://gladysassistant.com';
const SUPPORTED_LANGUAGES = ['fr', 'en'];

/**
 * Build the Gladys Plus landing/signup URL with UTM parameters so we can
 * track which places in the app drive Gladys Plus signups.
 *
 * @param {Object} options
 * @param {string} [options.language='en'] - User language (used to pick fr/en page).
 * @param {string} [options.campaign] - utm_campaign value (e.g. "settings_gateway_pricing").
 * @param {string} [options.content] - Optional utm_content value to differentiate
 *   multiple CTAs of the same campaign (e.g. "hero_cta", "plan_card_plus").
 * @returns {string} The full URL to the Gladys Plus landing page.
 */
export function buildGladysPlusUrl({ language = 'en', campaign, content } = {}) {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
  // English is served at the root of the marketing site (no /en/ prefix),
  // other supported languages have their own prefix (e.g. /fr/plus/).
  const path = lang === 'en' ? '/plus/' : `/${lang}/plus/`;
  const params = new URLSearchParams();
  params.set('utm_source', 'gladys_app');
  params.set('utm_medium', 'in_app');
  if (campaign) {
    params.set('utm_campaign', campaign);
  }
  if (content) {
    params.set('utm_content', content);
  }
  return `${GLADYS_PLUS_LANDING_BASE_URL}${path}?${params.toString()}`;
}
