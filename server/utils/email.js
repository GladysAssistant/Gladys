const { BadParameters } = require('./coreErrors');

/**
 * @description Bring an email typed by a user to the form it is stored in:
 * without surrounding spaces and in lower case. Phone keyboards often
 * capitalize the first letter or add a trailing space, the email stored in
 * database is always lower case (see the User model).
 * @param {string} email - The email as typed.
 * @returns {string} The normalized email.
 * @example
 * normalizeEmail(' Tony.Stark@Gladysassistant.com '); // 'tony.stark@gladysassistant.com'
 */
function normalizeEmail(email) {
  // the email comes straight from the request body: an array or a missing
  // value must not reach the database query
  if (typeof email !== 'string') {
    throw new BadParameters('Email must be a string');
  }
  return email.trim().toLowerCase();
}

module.exports = {
  normalizeEmail,
};
