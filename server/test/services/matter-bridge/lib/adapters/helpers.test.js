const { expect } = require('chai');

const {
  isFeature,
  isWritable,
  zipRoles,
  mergeState,
} = require('../../../../../services/matter-bridge/lib/adapters/helpers');

describe('Matter bridge adapter helpers', () => {
  it('should match a feature by category and types', () => {
    expect(isFeature({ category: 'light', type: 'binary' }, 'light', ['binary'])).to.equal(true);
    expect(isFeature({ category: 'light', type: 'color' }, 'light', ['binary'])).to.equal(false);
    expect(isFeature({ category: 'switch', type: 'binary' }, 'light', ['binary'])).to.equal(false);
  });

  it('should tell a writable feature from a read-only one', () => {
    expect(isWritable({ read_only: false })).to.equal(true);
    expect(isWritable({})).to.equal(true);
    expect(isWritable({ read_only: true })).to.equal(false);
  });

  it('should pair features of each role in order', () => {
    expect(zipRoles({ binary: ['b1', 'b2'], brightness: ['l1'] })).to.deep.equal([
      { binary: 'b1', brightness: 'l1' },
      { binary: 'b2' },
    ]);
    expect(zipRoles({ binary: [] })).to.deep.equal([]);
  });

  it('should merge partial states cluster by cluster', () => {
    expect(mergeState({ a: { x: 1 } }, { a: { y: 2 }, b: { z: 3 } })).to.deep.equal({
      a: { x: 1, y: 2 },
      b: { z: 3 },
    });
  });
});
