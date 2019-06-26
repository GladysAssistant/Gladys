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

export { isUrlInArray };
