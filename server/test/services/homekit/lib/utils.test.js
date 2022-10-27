const { expect } = require('chai');
const { normalize } = require('../../../../services/homekit/lib/utils');

describe('Test utils functions', () => {
  it('should normalize data to new range', async () => {
    const newValue = normalize(50, 0, 100, 0, 360);

    expect(newValue).to.equal(180);
  });
});
