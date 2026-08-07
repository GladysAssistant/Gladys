const { expect } = require('chai');
const sinon = require('sinon');

const { acknowledgeHostPowerCommand } = require('../../../api/controllers/system.controller.helpers');
const logger = require('../../../utils/logger');

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('acknowledgeHostPowerCommand', () => {
  it('should resolve when the command succeeds before the ack delay', async () => {
    await acknowledgeHostPowerCommand(Promise.resolve(), 'reboot host', 50);
  });

  it('should rethrow a failure that happens BEFORE the acknowledgement', async () => {
    let caught;
    try {
      await acknowledgeHostPowerCommand(Promise.reject(new Error('polkit refused')), 'reboot host', 1000);
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.an('error');
    expect(caught.message).to.equal('polkit refused');
  });

  it('should only log (not throw) a failure that happens AFTER the acknowledgement', async () => {
    const loggerStub = sinon.stub(logger, 'error');
    try {
      // Ack after 5ms, command rejects at 40ms → failure arrives post-ack.
      const command = delay(40).then(() => {
        throw new Error('helper failed late');
      });
      await acknowledgeHostPowerCommand(command, 'reboot host', 5);
      // Let the late rejection settle and be handled by the guard.
      await delay(60);
      sinon.assert.calledOnce(loggerStub);
    } finally {
      loggerStub.restore();
    }
  });
});
