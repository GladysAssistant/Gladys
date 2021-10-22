const { expect } = require('chai');
const { addSelector } = require('../../utils/addSelector');

describe('addSelector', () => {
  it('should add selector to object with random string, from name', () => {
    const item = {
      name: 'My beautiful room',
    };
    addSelector(item);
    expect(item).to.have.property('selector');
    expect(item.selector).to.have.lengthOf('my-beautiful-room-1234'.length);
    expect(item.selector.startsWith('my-beautiful-room-')).to.equal(true);
  });
});
