/**
 * @description Split the `items` array into multiple, smaller arrays of the given `size`.
 *
 * @param {Array} items - The base array to split in chunks.
 * @param {number} size - The max size of each chunk.
 * @example chunks([1, 2, 3, 4, 5, 6, 7, 8], 3)
 * @returns {Array} - Return array of chunks.
 */
function chunk(items, size) {
  const chunks = [];
  const clonedItems = [].concat(...items);

  while (clonedItems.length) {
    chunks.push(clonedItems.splice(0, size));
  }

  return chunks;
}

module.exports = {
  chunk,
};
