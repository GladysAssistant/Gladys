const Sequelize = require('sequelize');

const replaceAccentsSQlite = (column) => {
  // Single REPLACE function can handle all occurrences
  const replacements = [
    ['é', 'e'],
    ['è', 'e'],
    ['ê', 'e'],
    ['ë', 'e'],
    ['à', 'a'],
    ['â', 'a'],
    ['ä', 'a'],
    ['ù', 'u'],
    ['û', 'u'],
    ['ü', 'u'],
    ['ô', 'o'],
    ['ö', 'o'],
    ['î', 'i'],
    ['ï', 'i'],
    ['ç', 'c'],
    ['ñ', 'n'],
  ];

  return replacements.reduce(
    (expr, [accented, unaccented]) => Sequelize.fn('replace', expr, accented, unaccented),
    column,
  );
};

const removeAccentsString = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

module.exports = {
  replaceAccentsSQlite,
  removeAccentsString,
};
