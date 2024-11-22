const Joi = require('joi');
const { InvalidURL } = require('./coreErrors');

/**
 * @description Typeof url.
 * @param {string} str - The url of the backup.
 * @returns {boolean} Return true for valid url.
 * @example
 * isURL();
 */
const isURL = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * @description Validate the url.
 * @param {string} url - The url of the backup.
 * @returns {string} Return a valid url.
 * @example
 * validateUrl();
 */
function validateUrl(url) {
  const schema = Joi.string()
    .uri()
    .pattern(/^[^?#]*$/, '');
  const { error, value } = schema.validate(url);
  if (error) {
    throw new InvalidURL('INVALID_URL');
  } else {
    return value;
  }
}

module.exports = {
  isURL,
  validateUrl,
};
