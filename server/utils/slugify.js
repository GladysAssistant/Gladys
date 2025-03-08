const addRandomCharacter = (inputString) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomChars = '';
  for (let i = 0; i < 4; i += 1) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomChars += characters[randomIndex];
  }
  return `${inputString}-${randomChars}`;
};

/**
 * @description Transform a string to a valid slug (useful for selector).
 * @param {string} str - The string to transform.
 * @param {boolean} addRandomCharacters - If the slugify should add random characters at the end.
 * @returns {string} Return the slug.
 * @example
 * slugify('Living room light');
 */
function slugify(str, addRandomCharacters = false) {
  let newString = str;
  newString = newString.replace(/^\s+|\s+$/g, ''); // trim
  newString = newString.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  const to = 'aaaaeeeeiiiioooouuuunc------';
  for (let i = 0, l = from.length; i < l; i += 1) {
    newString = newString.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  newString = newString
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  // Remove trailing and leading dashes if present
  if (newString.startsWith('-')) {
    newString = newString.slice(1);
  }
  if (newString.endsWith('-')) {
    newString = newString.slice(0, -1);
  }

  // Add 4 random characters if needed
  if (addRandomCharacters) {
    newString = addRandomCharacter(newString);
  }

  return newString;
}

module.exports = {
  slugify,
};
