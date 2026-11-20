const { expect } = require('chai');
const { ServiceNotReadyError } = require('../../utils/coreErrors');

describe('coreErrors ServiceNotReadyError', () => {
  it('should be an Error carrying its message', () => {
    const error = new ServiceNotReadyError('Zigbee2mqtt is not ready yet');
    expect(error).to.be.instanceOf(Error);
    expect(error).to.be.instanceOf(ServiceNotReadyError);
    expect(error.message).to.equal('Zigbee2mqtt is not ready yet');
  });
});
