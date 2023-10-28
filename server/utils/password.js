const bcrypt = require('bcrypt');
const { BadParameters } = require('./coreErrors');

const SALT_ROUNDS = 10;

const KEY_STRINGS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  number: '0123456789',
  symbol: '*;<>()[]{}#$?!^|',
};

const generate = (length = 20, options = undefined) => {
  const availableChars = Object.keys(KEY_STRINGS)
    .filter((k) => !options || options[k])
    .map((k) => KEY_STRINGS[k])
    .join('');

  if (availableChars.length === 0) {
    throw new BadParameters('Options are missing on password generation.');
  }

  const availableCharsLength = availableChars.length;
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += availableChars[Math.floor(Math.random() * availableCharsLength)];
  }
  return password;
};

module.exports = {
  hash: (password, hashRound = SALT_ROUNDS) => bcrypt.hash(password, hashRound),
  compare: (password, hash) => bcrypt.compare(password, hash),
  generate,
};
