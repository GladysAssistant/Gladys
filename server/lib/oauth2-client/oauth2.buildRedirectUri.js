/**
 * @description Build redirect uri for oauth2 service.
 * @param {string} referer - Http referer.
 * @param {string} redirectUriSuffix - Redirect uri suffix.
 * @returns {string} Redirect uri for oauth2 service.
 * @example
 * oauth2.deleteClient(
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  serviceId: 'ffsdvs687f0bf3414e0fe3facfba7be945510fds09a'
 *  }
 * );
 */
function buildRedirectUri(referer, redirectUriSuffix) {
  let redirectUri = referer;
  if (redirectUri) {
    if (redirectUri.includes('?')) {
      // Remove parameter if present in referer
      redirectUri = redirectUri.substring(0, redirectUri.indexOf('?'));
    }

    if (!referer.includes(redirectUriSuffix)) {
      // Add suffix of redirectUri if not present in referer
      redirectUri = `${redirectUri}${redirectUriSuffix}`;
    }
  }
  return redirectUri;
}

module.exports = {
  buildRedirectUri,
};
