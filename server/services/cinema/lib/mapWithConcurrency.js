/**
 * @description Map over items, running at most `concurrency` async calls at once.
 * @param {Array} items - The items to map over.
 * @param {number} concurrency - Maximum number of in-flight calls.
 * @param {Function} mapper - Async function called with each item.
 * @returns {Promise<Array>} Resolve with the mapped results, in the original order.
 * @example
 * const results = await mapWithConcurrency([1, 2, 3], 2, (n) => doSomething(n));
 */
async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  /**
   * @description Pull items off the shared queue one at a time until it's empty.
   * @returns {Promise<void>} Resolve once no item is left to process.
   * @example
   * await worker();
   */
  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      // Sequential within a single worker by design: concurrency comes from
      // running several workers in parallel (below), not from overlapping
      // calls inside one of them.
      // eslint-disable-next-line no-await-in-loop
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = new Array(Math.min(concurrency, items.length)).fill(null).map(() => worker());
  await Promise.all(workers);
  return results;
}

module.exports = {
  mapWithConcurrency,
};
