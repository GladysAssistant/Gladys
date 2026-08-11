const { expect } = require('chai');

const { buildUniqueSelector } = require('../../utils/addSelector');
const { ConflictError } = require('../../utils/coreErrors');

const BASE = 'macbook-pro-de-pierre';

// A minimal stand-in for a sequelize model: only the selector lookup matters
const fakeModel = (takenSelectors) => ({
  findOne: async ({ where }) => (takenSelectors.includes(where.selector) ? { id: 'existing-row' } : null),
});

describe('utils.buildUniqueSelector', () => {
  it('should return the slugified base when it is free', async () => {
    const selector = await buildUniqueSelector(fakeModel([]), 'MacBook Pro de Pierre');
    expect(selector).to.equal(BASE);
  });

  it('should return an empty selector when there is nothing to slugify', async () => {
    const selector = await buildUniqueSelector(fakeModel([]), undefined);
    expect(selector).to.equal('');
  });

  it('should add a numeric suffix when the base is taken', async () => {
    const selector = await buildUniqueSelector(fakeModel([BASE]), BASE);
    expect(selector).to.equal(`${BASE}-2`);
  });

  it('should keep incrementing until a free suffix is found', async () => {
    const selector = await buildUniqueSelector(fakeModel([BASE, `${BASE}-2`, `${BASE}-3`]), BASE);
    expect(selector).to.equal(`${BASE}-4`);
  });

  it('should not hand out a selector already reserved in the current batch', async () => {
    const taken = new Set([BASE]);
    const selector = await buildUniqueSelector(fakeModel([]), BASE, { taken });
    expect(selector).to.equal(`${BASE}-2`);
    // the freshly picked selector is reserved for the rest of the batch
    expect(taken.has(`${BASE}-2`)).to.equal(true);
  });

  it('should fall back to random characters past the numeric suffixes', async () => {
    const numericSelectors = [BASE];
    for (let suffix = 2; suffix <= 21; suffix += 1) {
      numericSelectors.push(`${BASE}-${suffix}`);
    }
    const selector = await buildUniqueSelector(fakeModel(numericSelectors), BASE);
    expect(selector).to.match(new RegExp(`^${BASE}-[a-z0-9]{4}$`));
  });

  it('should throw a ConflictError when no candidate is free', async () => {
    const alwaysTakenModel = { findOne: async () => ({ id: 'existing-row' }) };
    try {
      await buildUniqueSelector(alwaysTakenModel, BASE);
      expect.fail('should have thrown');
    } catch (e) {
      // a 409 like the one the DB unique constraint produces, not a 500
      expect(e).to.be.an.instanceOf(ConflictError);
      expect(e.message).to.include(`Unable to find a free selector based on "${BASE}"`);
    }
  });
});
