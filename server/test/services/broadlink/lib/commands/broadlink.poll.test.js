const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { BadParameters } = require('../../../../../utils/coreErrors');

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
});
