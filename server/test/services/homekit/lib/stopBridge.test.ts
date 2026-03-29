const { expect } = require('chai');
const { stub } = require('sinon');
const { stopBridge } = require('../../../../services/homekit/lib/stopBridge');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

describe('Stop bridge', () => {
  it('should stop a bridge', async () => {
    const homekitHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      stopBridge,
      gladys: {
        event: {
          removeListener: stub().returns(),
        },
      },
      notifyTimeouts: {
        'home:door:binary': {
          startDateTime: new Date().getTime(),
        },
      },
      notifyCb: stub().returns(),
      bridge: {
        unpublish: stub().resolves(),
      },
    };

    await homekitHandler.stopBridge();

    expect(homekitHandler.notifyTimeouts).to.eql({});
    expect(homekitHandler.notifyCb).to.eql(null);
    expect(homekitHandler.bridge).to.eql(null);
  });
});
