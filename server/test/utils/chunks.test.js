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
  it('should throw error', () => {
    expect(() => {
      chunk([{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }], 0);
    }).to.throw(Error, 'Chunk size must be greater than 0.');
  });
  it('should throw error', () => {
    expect(() => {
      // @ts-ignore
      chunk([{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }], 'kjlsfjs');
    }).to.throw(Error, 'Chunk size must be an integer.');
  });

  it('should chunk big array of objects', () => {
    const bigArray = [];
    for (let i = 0; i < 150000; i += 1) {
      bigArray.push({ name: '1' });
    }
    const arrays = chunk(bigArray, 500);
    expect(arrays).to.be.instanceOf(Array);
    expect(arrays).to.have.lengthOf(300);
  });
});
