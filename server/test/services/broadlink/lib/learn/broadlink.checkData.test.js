const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.checkData', () => {
  const serviceId = 'service-id';

  let broadlink;
  let gladys;
  let broadlinkHandler;
  let clock;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    broadlink = {};
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
    broadlinkHandler.cancelLearn = fake.resolves(null);
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should stop loop', async () => {
    const broadlinkDevice = {
      checkData: fake.resolves(null),
    };
    const peripheralIdentifier = 'identifier';
    const iteration = 30;

    await broadlinkHandler.checkData(broadlinkDevice, peripheralIdentifier, iteration);

    assert.calledOnceWithExactly(broadlinkHandler.cancelLearn, peripheralIdentifier);
    assert.notCalled(broadlinkDevice.checkData);
    assert.notCalled(gladys.event.emit);
  });

  it('should loop once', async () => {
    const broadlinkDevice = {
      checkData: fake.rejects(null),
    };
    const peripheralIdentifier = 'identifier';

    await broadlinkHandler.checkData(broadlinkDevice, peripheralIdentifier, 29);

    clock.tick(800);

    assert.calledOnceWithExactly(broadlinkHandler.cancelLearn, peripheralIdentifier);
    assert.calledOnceWithExactly(broadlinkDevice.checkData);
    assert.notCalled(gladys.event.emit);
  });

  it('should not loop on success', async () => {
    const broadlinkDevice = {
      checkData: fake.resolves(Buffer.from([11, 22])),
    };
    const peripheralIdentifier = 'identifier';

    await broadlinkHandler.checkData(broadlinkDevice, peripheralIdentifier);

    assert.notCalled(broadlinkHandler.cancelLearn);
    assert.calledOnceWithExactly(broadlinkDevice.checkData);
    assert.calledOnceWithExactly(gladys.event.emit, 'websocket.send-all', {
      type: 'broadlink.learn',
      payload: {
        action: 'success',
        code: '0b16',
      },
    });
  });
});
