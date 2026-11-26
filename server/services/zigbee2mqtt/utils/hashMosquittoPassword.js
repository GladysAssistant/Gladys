const crypto = require('crypto');

// The scheme of mosquitto_passwd in Mosquitto 2 ("$7$": PBKDF2 with SHA-512), with its default iteration count and
// sizes: a file written this way is read by the broker on its first start, without running mosquitto_passwd in it
const ITERATIONS = 101;
const SALT_LENGTH_IN_BYTES = 12;
const HASH_LENGTH_IN_BYTES = 64;

/**
 * @description Hash a password like mosquitto_passwd does, for a line of the password file of Mosquitto.
 * @param {string} password - Password in clear.
 * @returns {string} The hashed password, like "$7$101$<salt in base64>$<hash in base64>".
 * @example
 * const line = `${username}:${hashMosquittoPassword(password)}`;
 */
function hashMosquittoPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH_IN_BYTES);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, HASH_LENGTH_IN_BYTES, 'sha512');
  return `$7$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

module.exports = {
  hashMosquittoPassword,
};
