const { expect } = require('chai');
const Promise = require('bluebird');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { BadParameters } = require('../../../../../utils/coreErrors');
const { POLL_TIMEOUT } = require('../../../../../services/broadlink/lib/utils/broadlink.constants');

describe('broadlink.poll', () => {
  const serviceId = 'service-id';
  const broadlink = {};

  let gladys;
  let broadlinkHandler;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
  });

  afterEach(() => {
    sinon.restore();
    sinon.reset();
  });

  it('no peripheral parameter', async () => {
    const device = {
      external_id: 'externalId',
    };

    try {
      await broadlinkHandler.poll(device);
      expect.fail();
    } catch (e) {
      expect(e)
        .to.be.instanceOf(BadParameters)
        .haveOwnProperty('message', `${device.external_id} device is not well configured, please try to update it`);
    }
    assert.notCalled(gladys.event.emit);
  });

  it('no device mapper', async () => {
    broadlinkHandler.getDevice = fake.resolves({ name: 'device' });
    broadlinkHandler.loadMapper = fake.returns(undefined);

    const device = {
      external_id: 'externalId',
      params: [
        {
          name: 'peripheral',
          value: 'mac',
        },
      ],
    };

    try {
      await broadlinkHandler.poll(device);
      expect.fail();
    } catch (e) {
      expect(e)
        .to.be.instanceOf(BadParameters)
        .haveOwnProperty('message', `${device.external_id} device is not managed by Broadlink for polling`);
    }

    assert.calledOnceWithExactly(broadlinkHandler.getDevice, 'mac');
    assert.calledOnceWithExactly(broadlinkHandler.loadMapper, { name: 'device' });
    assert.notCalled(gladys.event.emit);
  });

  it('no device mapper without poll', async () => {
    broadlinkHandler.getDevice = fake.resolves({ name: 'device' });
    broadlinkHandler.loadMapper = fake.returns({});

    const device = {
      external_id: 'externalId',
      params: [
        {
          name: 'peripheral',
          value: 'mac',
        },
      ],
    };

    await broadlinkHandler.poll(device);

    assert.calledOnceWithExactly(broadlinkHandler.getDevice, 'mac');
    assert.calledOnceWithExactly(broadlinkHandler.loadMapper, { name: 'device' });
    assert.notCalled(gladys.event.emit);
  });

  it('should call device mapper poll', async () => {
    const message = {
      device_feature_external_id: 'id',
      state: 'state',
    };
    const deviceMapper = {
      poll: fake.resolves([message]),
    };
    broadlinkHandler.getDevice = fake.resolves({ name: 'device' });
    broadlinkHandler.loadMapper = fake.returns(deviceMapper);

    const device = {
      external_id: 'externalId',
      params: [
        {
          name: 'peripheral',
          value: 'mac',
        },
      ],
    };

    await broadlinkHandler.poll(device);

    assert.calledOnceWithExactly(broadlinkHandler.getDevice, 'mac');
    assert.calledOnceWithExactly(broadlinkHandler.loadMapper, { name: 'device' });
    assert.calledOnceWithExactly(deviceMapper.poll, { name: 'device' }, device);
    assert.calledOnceWithExactly(gladys.event.emit, 'device.new-state', message);
  });

  it('should stop waiting for a device which does not answer', async () => {
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const deviceMapper = {
      // node-broadlink requests never settle when the device does not answer
      poll: fake.returns(new Promise(() => {})),
    };
    broadlinkHandler.getDevice = fake.resolves({ name: 'device' });
    broadlinkHandler.loadMapper = fake.returns(deviceMapper);

    const device = {
      external_id: 'externalId',
      params: [
        {
          name: 'peripheral',
          value: 'mac',
        },
      ],
    };

    const polling = expect(broadlinkHandler.poll(device)).to.be.rejectedWith(
      Promise.TimeoutError,
      'Broadlink device externalId did not answer to polling',
    );
    await clock.tickAsync(POLL_TIMEOUT);
    await polling;

    assert.calledOnceWithExactly(deviceMapper.poll, { name: 'device' }, device);
    assert.notCalled(gladys.event.emit);
  });
});
