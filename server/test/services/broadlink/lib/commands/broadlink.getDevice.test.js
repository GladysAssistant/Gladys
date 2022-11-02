const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

describe('broadlink.getDevice', () => {
  const gladys = {};
  const broadlink = {};
  const serviceId = 'service-id';
  let broadlinkHandler;

  beforeEach(() => {
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

    broadlinkHandler.broadlinkDevices = { '0b16': { mac: [11, 22] } };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not re-init on device found', async () => {
    broadlink.discover = fake.rejects(null);

    const device = await broadlinkHandler.getDevice('0b16');
    expect(device).to.deep.eq({ mac: [11, 22] });
    assert.notCalled(broadlink.discover);
  });

  it('should re-init on no device found', async () => {
    const broadlinkDevice = { mac: [33, 44], auth: fake.resolves(null) };
    broadlink.discover = fake.resolves([broadlinkDevice]);

    const device = await broadlinkHandler.getDevice('212c');
    expect(device).to.deep.eq(broadlinkDevice);
    assert.calledOnceWithExactly(broadlink.discover);
  });

  it('should re-init and not found device', async () => {
    const broadlinkDevice = { mac: [33, 44], auth: fake.resolves(null) };
    broadlink.discover = fake.resolves([broadlinkDevice]);

    try {
      await broadlinkHandler.getDevice('5566');
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }
    assert.calledOnceWithExactly(broadlink.discover);
  });
});
