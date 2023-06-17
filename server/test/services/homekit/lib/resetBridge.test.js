const { expect } = require('chai');
const { stub } = require('sinon');
const { resetBridge } = require('../../../../services/homekit/lib/resetBridge');
const { EVENTS } = require('../../../../utils/constants');

describe('Reset bridge', () => {
  it('should reset a bridge', async () => {
    const destroyFn = stub().resolves();
    const homekitHandler = {
      resetBridge,
      createBridge: stub().resolves(),
      gladys: {
        event: {
          removeListener: stub().returns(),
        },
      },
      notifyCb: stub().returns(),
      bridge: {
        destroy: destroyFn,
      },
    };

    await homekitHandler.resetBridge();

    expect(homekitHandler.gladys.event.removeListener.args[0][0]).eq(EVENTS.TRIGGERS.CHECK);
    expect(homekitHandler.notifyCb).to.eq(null);

    expect(destroyFn.callCount).to.eq(1);
    expect(homekitHandler.bridge).to.eq(null);
    expect(homekitHandler.createBridge.callCount).to.eq(1);
  });
});
