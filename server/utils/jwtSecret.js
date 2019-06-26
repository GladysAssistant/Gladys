const crypto = require('crypto');

const JWT_SECRET_LENGTH = 500;

/**
 * @private
 * @description Generate a jwt secret.
 * @example
 * const jwtSecret = generateJwtSecret();
 * @returns {string} JwtSecret.
 */
function generateJwtSecret() {
  const jwtSecret = crypto
    .randomBytes(Math.ceil(JWT_SECRET_LENGTH / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, JWT_SECRET_LENGTH); // return required number of characters

  return jwtSecret;
}

module.exports = {
  generateJwtSecret,
};
