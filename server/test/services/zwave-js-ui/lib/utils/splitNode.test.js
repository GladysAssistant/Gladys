const { expect } = require('chai');
const { splitNode } = require('../../../../../services/zwave-js-ui/lib/utils/splitNode');

describe('zwave.splitNode', () => {
  it('should get one node', () => {
    const nodes = splitNode({
      endpoints: [],
    });
    expect(nodes).to.not.be.an('array');
  });

  it('should get 3 nodes for 2 endpoint', () => {
    const nodes = splitNode({
      endpoints: [
        {
          index: 0,
        },
        {
          index: 1,
        },
      ],
      classes: {},
    });
    expect(nodes).to.be.an('array');
  });
});
