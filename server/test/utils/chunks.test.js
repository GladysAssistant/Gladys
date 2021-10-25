const { expect } = require('chai');
const { chunk } = require('../../utils/chunks');

describe('chunk', () => {
  it('should chunk array of integer', () => {
    const arrays = chunk([1, 2, 3, 4, 5, 6, 7], 3);
    expect(arrays).to.deep.equal([[1, 2, 3], [4, 5, 6], [7]]);
  });
  it('should chunk array of objects', () => {
    const arrays = chunk([{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }], 2);
    expect(arrays).to.deep.equal([[{ name: '1' }, { name: '2' }], [{ name: '3' }, { name: '4' }], [{ name: '5' }]]);
  });
});
