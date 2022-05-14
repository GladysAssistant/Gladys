const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.addPeripheral', () => {
  const gladys = {};
  const broadlink = {};
  const serviceId = 'service-id';

  let broadlinkHandler;

  beforeEach(() => {
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not add device', async () => {
    broadlinkHandler.buildPeripheral = fake.returns(undefined);

    const broadlinkDevice = {
      mac: [11, 22, 33, 44, 55, 66],
      host: { address: '127.0.0.1' },
      model: 'model',
      auth: fake.resolves(null),
    };
    await broadlinkHandler.addPeripheral(broadlinkDevice);

    assert.calledOnceWithExactly(broadlinkDevice.auth);

    expect(broadlinkHandler.peripherals).to.deep.eq({});
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({ '0b16212c3742': broadlinkDevice });
  });

  it('should not add peripheral', async () => {
    broadlinkHandler.buildPeripheral = fake.returns(undefined);

    const broadlinkDevice = {
      mac: [11, 22, 33, 44, 55, 66],
      host: { address: '127.0.0.1' },
      model: 'model',
      auth: fake.resolves(null),
    };
    await broadlinkHandler.addPeripheral(broadlinkDevice);

    assert.calledOnceWithExactly(broadlinkDevice.auth);

    expect(broadlinkHandler.peripherals).to.deep.eq({});
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({ '0b16212c3742': broadlinkDevice });
  });

  it('should add device on auth error', async () => {
    broadlinkHandler.buildPeripheral = fake.returns({ canLearn: true });

    const broadlinkDevice = {
      mac: [11, 22, 33, 44, 55, 66],
      host: { address: '127.0.0.1' },
      model: 'model',
      auth: fake.rejects(null),
    };
    await broadlinkHandler.addPeripheral(broadlinkDevice);

    assert.calledOnceWithExactly(broadlinkDevice.auth);

    expect(broadlinkHandler.peripherals).to.deep.eq({
      '0b16212c3742': {
        mac: '0b16212c3742',
        name: 'model',
        model: 'model',
        address: '127.0.0.1',
        canLearn: true,
        connectable: false,
      },
    });
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({ '0b16212c3742': broadlinkDevice });
  });

  it('should not add invalid device', async () => {
    broadlinkHandler.buildPeripheral = fake.returns({});

    const broadlinkDevice = {
      mac: [11, 22, 33, 44, 55, 66],
      host: { address: '127.0.0.1' },
      model: 'model',
      auth: fake.resolves(null),
    };
    await broadlinkHandler.addPeripheral(broadlinkDevice);

    assert.calledOnceWithExactly(broadlinkDevice.auth);

    expect(broadlinkHandler.peripherals).to.deep.eq({});
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({ '0b16212c3742': broadlinkDevice });
  });

  it('should add learnable device', async () => {
    broadlinkHandler.buildPeripheral = fake.returns({ canLearn: true });

    const broadlinkDevice = {
      mac: [11, 22, 33, 44, 55, 66],
      host: { address: '127.0.0.1' },
      model: 'model',
      auth: fake.resolves(null),
    };
    await broadlinkHandler.addPeripheral(broadlinkDevice);

    assert.calledOnceWithExactly(broadlinkDevice.auth);

    expect(broadlinkHandler.peripherals).to.deep.eq({
      '0b16212c3742': {
        mac: '0b16212c3742',
        name: 'model',
        model: 'model',
        address: '127.0.0.1',
        canLearn: true,
        connectable: true,
      },
    });
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({ '0b16212c3742': broadlinkDevice });
  });

  it('should add device', async () => {
    broadlinkHandler.buildPeripheral = fake.returns({ device: { features: [] } });

    const broadlinkDevice = {
      mac: [11, 22, 33, 44, 55, 66],
      host: { address: '127.0.0.1' },
      model: 'model',
      auth: fake.resolves(null),
    };
    await broadlinkHandler.addPeripheral(broadlinkDevice);

    assert.calledOnceWithExactly(broadlinkDevice.auth);

    expect(broadlinkHandler.peripherals).to.deep.eq({
      '0b16212c3742': {
        mac: '0b16212c3742',
        name: 'model',
        model: 'model',
        address: '127.0.0.1',
        connectable: true,
        device: { features: [] },
      },
    });
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({ '0b16212c3742': broadlinkDevice });
  });
});
