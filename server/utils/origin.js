/**
 * @description Parse a browser origin ("https://gladys.example.com:1443") and
 * return it in its canonical form, or null when the value is not a plain
 * http(s) origin (path, query, credentials, other scheme, garbage...).
 * @param {string} value - The origin to parse (Origin header, window.location.origin).
 * @returns {string|null} The canonical origin, or null.
 * @example
 * parseOrigin('HTTP://Gladys.local:80/'); // 'http://gladys.local'
 */
function parseOrigin(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  let url;
  try {
    url = new URL(value);
  } catch (e) {
    return null;
  }
  const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
  const isBareOrigin =
    url.username === '' && url.password === '' && url.pathname === '/' && url.search === '' && url.hash === '';
  if (!isHttp || !isBareOrigin) {
    return null;
  }
  return url.origin;
}

module.exports = {
  parseOrigin,
};
