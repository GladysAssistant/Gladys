const { expect } = require('chai');
const { mapWithConcurrency } = require('../../../../services/tmdb/lib/mapWithConcurrency');

describe('mapWithConcurrency', () => {
  it('should map every item and preserve the original order', async () => {
    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => n * 10);
    expect(results).to.deep.equal([10, 20, 30, 40, 50]);
  });
  it('should never run more than `concurrency` mappers at the same time', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 3, async (n) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
      inFlight -= 1;
      return n;
    });
    expect(maxInFlight).to.be.at.most(3);
  });
  it('should resolve to an empty array for an empty input', async () => {
    const results = await mapWithConcurrency([], 3, async (n) => n);
    expect(results).to.deep.equal([]);
  });
  it('should work when concurrency is greater than the number of items', async () => {
    const results = await mapWithConcurrency([1, 2], 10, async (n) => n + 1);
    expect(results).to.deep.equal([2, 3]);
  });
});
