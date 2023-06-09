const { expect } = require('chai');

const NodeRedManager = require('../../../../services/node-red/lib');

const gladys = {};
const serviceId = '625a8a9a-aa9d-474f-8cec-0718dd4ade04';

describe('NodeRed isEnabled', () => {
  let nodeRedService;
  beforeEach(() => {
    nodeRedService = new NodeRedManager(gladys, serviceId);
  });

  it('should return false', () => {
    nodeRedService.nodeRedRunning = false;

    const result = nodeRedService.isEnabled();
    expect(result).to.equal(false);
  });

  it('should return true', () => {
    nodeRedService.nodeRedRunning = true;

    const result = nodeRedService.isEnabled();
    expect(result).to.equal(true);
  });
});
