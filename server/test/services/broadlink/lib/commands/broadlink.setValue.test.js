const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { BadParameters } = require('../../../../../utils/coreErrors');

describe('broadlink.setValue', () => {
  const gladys = {};
  const serviceId = 'service-id';
  const broadlink = {};

  let broadlinkHandler;

  beforeEach(() => {
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('no peripheral parameter', async () => {
    const device = {
      external_id: 'externalId',
    };
    const deviceFeature = {};
    const value = 0;

    try {
      await broadlinkHandler.setValue(device, deviceFeature, value);
      expect.fail();
    } catch (e) {
      expect(e)
        .to.be.instanceOf(BadParameters)
        .haveOwnProperty('message', `${device.external_id} device is not well configured, please try to update it`);
    }
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
    const deviceFeature = {};
    const value = 0;

    try {
      await broadlinkHandler.setValue(device, deviceFeature, value);
      expect.fail();
    } catch (e) {
      expect(e)
        .to.be.instanceOf(BadParameters)
        .haveOwnProperty('message', `${device.external_id} device is not managed by Broadlink`);
    }

    assert.calledOnceWithExactly(broadlinkHandler.getDevice, 'mac');
    assert.calledOnceWithExactly(broadlinkHandler.loadMapper, { name: 'device' });
  });

  it('no device mapper without setValue', async () => {
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
    const deviceFeature = {};
    const value = 0;

    try {
      await broadlinkHandler.setValue(device, deviceFeature, value);
      expect.fail();
    } catch (e) {
      expect(e)
        .to.be.instanceOf(BadParameters)
        .haveOwnProperty('message', `${device.external_id} device is not managed by Broadlink`);
    }

    assert.calledOnceWithExactly(broadlinkHandler.getDevice, 'mac');
    assert.calledOnceWithExactly(broadlinkHandler.loadMapper, { name: 'device' });
  });

  it('should call device mapper setValue', async () => {
    const deviceMapper = {
      setValue: fake.resolves(null),
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
    const deviceFeature = {};
    const value = 0;

    const result = await broadlinkHandler.setValue(device, deviceFeature, value);

    expect(result).to.eq(value);
    assert.calledOnceWithExactly(broadlinkHandler.getDevice, 'mac');
    assert.calledOnceWithExactly(broadlinkHandler.loadMapper, { name: 'device' });
    assert.calledOnceWithExactly(deviceMapper.setValue, { name: 'device' }, device, deviceFeature, value);
  });
});
