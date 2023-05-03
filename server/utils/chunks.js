/**
 * @description Split the `items` array into multiple, smaller arrays of the given `size`.
 * @param {Array} items - The base array to split in chunks.
 * @param {number} size - The max size of each chunk.
 * @example chunks([1, 2, 3, 4, 5, 6, 7, 8], 3)
 * @returns {Array} - Return array of chunks.
 */
function chunk(items, size) {
  if (!Number.isInteger(size)) {
    throw new Error('Chunk size must be an integer.');
  }

  if (size < 1) {
    throw new Error('Chunk size must be greater than 0.');
  }

  const chunks = [];
  let i = 0;
  while (i < items.length) {
    chunks.push(items.slice(i, (i += size)));
  }
  return chunks;
}

module.exports = {
  chunk,
};
