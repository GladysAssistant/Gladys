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
  if (typeof email !== 'string') {
    return email;
  }
  return email.trim().toLowerCase();
}

module.exports = {
  normalizeEmail,
};
