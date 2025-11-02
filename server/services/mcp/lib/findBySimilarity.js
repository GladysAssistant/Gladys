/**
 * @description Find an item in a list by similarity of its name.
 * @param {object} list - List of items with a name property.
 * @param {string} name - Name to find.
 * @returns {object} Found item or empty.
 * @example
 * findBySimilarity([{name: 'salon', id: 1}, {name: 'cuisine', id: 2}], 'Salon');
 */
function findBySimilarity(list, name) {
  const nameLower = name.toLowerCase();
  const exactMatch = list.find((elem) => elem.name.toLowerCase() === nameLower);

  if (exactMatch) {
    return exactMatch;
  }

  const similars = [];
  list.forEach((elem) => {
    const similarNumber = this.levenshtein.distance(elem.name.toLowerCase(), nameLower);
    if (similarNumber <= 3) {
      similars.push({ elem, similarNumber });
    }
  });

  if (similars.length > 0) {
    similars.sort((a, b) => a.similarNumber - b.similarNumber);

    return similars[0].elem;
  }

  return {};
}

module.exports = {
  findBySimilarity,
};
