const { EventEmitter } = require('events');
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
    // node-broadlink requests wait for the device answer on the device socket, forever
    const socket = new EventEmitter();
    const broadlinkDevice = { name: 'device', socket };
    const deviceMapper = {
      poll: fake(() => {
        socket.once('message', () => {});
        return new Promise(() => {});
      }),
    };
    broadlinkHandler.getDevice = fake.resolves(broadlinkDevice);
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

    assert.calledOnceWithExactly(deviceMapper.poll, broadlinkDevice, device);
    expect(socket.listenerCount('message')).to.eq(0);
    assert.notCalled(gladys.event.emit);
  });

  it('should keep pending requests on polling error', async () => {
    const socket = new EventEmitter();
    const broadlinkDevice = { name: 'device', socket };
    const deviceMapper = {
      poll: fake(() => {
        socket.once('message', () => {});
        return Promise.reject(new Error('polling error'));
      }),
    };
    broadlinkHandler.getDevice = fake.resolves(broadlinkDevice);
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

    await expect(broadlinkHandler.poll(device)).to.be.rejectedWith(Error, 'polling error');

    expect(socket.listenerCount('message')).to.eq(1);
    assert.notCalled(gladys.event.emit);
  });
});
