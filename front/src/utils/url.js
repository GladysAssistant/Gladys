function isUrlInArray(url, array) {
  let splittedUrl = url.split('?')[0];
  if (splittedUrl.substring(splittedUrl.length - 1) === '/') {
    splittedUrl = splittedUrl.substring(0, splittedUrl.length - 1);
  }
  if (array.includes(splittedUrl)) {
    return true;
  }
  return false;
}

// A return URL is only accepted when it is a path on this same origin:
// it must start with "/" but not with "//" or "/\\" (which browsers treat as
// protocol-relative URLs pointing to another domain).
function isSafeReturnUrl(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');
}

export { isUrlInArray, isSafeReturnUrl };
