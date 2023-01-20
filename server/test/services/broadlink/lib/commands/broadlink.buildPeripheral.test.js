const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

const gladys = {};
const broadlink = {};
const serviceId = 'dc96648e-45f7-4b67-9f45-493fd114450f';

describe('broadlink.device.createDevice', () => {
  let broadlinkHandler;

  beforeEach(() => {
    gladys.stateManager = {
      get: fake.returns(null),
    };
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('device not managed', () => {
    broadlinkHandler.loadMapper = fake.returns(undefined);

    const broadlinkDevice = 'not-managed';
    const peripheral = broadlinkHandler.buildPeripheral(broadlinkDevice);
    expect(peripheral).to.eq(null);

    assert.notCalled(gladys.stateManager.get);
  });

  it('can learn device without features', () => {
    const deviceMapper = {
      canLearn: true,
      buildFeatures: fake.returns([]),
    };
    broadlinkHandler.loadMapper = fake.returns(deviceMapper);

    const broadlinkDevice = { mac: [11, 22], model: 'model' };
    const peripheral = broadlinkHandler.buildPeripheral(broadlinkDevice);
    expect(peripheral).to.deep.eq({ canLearn: true });

    assert.calledOnceWithExactly(deviceMapper.buildFeatures, 'model', 'broadlink:0b16', broadlinkDevice);
    assert.notCalled(gladys.stateManager.get);
  });

  it('cannot learn device with features', () => {
    const broadlinkDevice = {
      mac: [11, 22],
      model: 'model',
      manufacturer: 'Broadlink',
    };

    const deviceMapper = {
      buildFeatures: fake.returns([{ name: 'feature' }]),
    };
    broadlinkHandler.loadMapper = fake.returns(deviceMapper);

    const peripheral = broadlinkHandler.buildPeripheral(broadlinkDevice);

    const device = {
      name: 'model',
      external_id: 'broadlink:0b16',
      selector: 'broadlink:0b16',
      features: [{ name: 'feature' }],
      model: 'model',
      params: [
        { name: 'peripheral', value: '0b16' },
        { name: 'manufacturer', value: 'Broadlink' },
      ],
      poll_frequency: null,
      should_poll: false,
      service_id: serviceId,
    };
    expect(peripheral).to.deep.eq({ canLearn: false, device });

    assert.calledOnceWithExactly(deviceMapper.buildFeatures, 'model', 'broadlink:0b16', broadlinkDevice);
    assert.calledOnce(gladys.stateManager.get);
  });

  it('can learn device with poll features', () => {
    const broadlinkDevice = {
      mac: [11, 22],
      model: 'model',
      manufacturer: 'Broadlink',
    };

    const deviceMapper = {
      buildFeatures: fake.returns([{ read_only: true }]),
    };
    broadlinkHandler.loadMapper = fake.returns(deviceMapper);

    const peripheral = broadlinkHandler.buildPeripheral(broadlinkDevice);

    const device = {
      name: 'model',
      external_id: 'broadlink:0b16',
      selector: 'broadlink:0b16',
      features: [{ read_only: true }],
      model: 'model',
      params: [
        { name: 'peripheral', value: '0b16' },
        { name: 'manufacturer', value: 'Broadlink' },
      ],
      poll_frequency: 60000,
      should_poll: true,
      service_id: serviceId,
    };
    expect(peripheral).to.deep.eq({ canLearn: false, device });

    assert.calledOnceWithExactly(deviceMapper.buildFeatures, 'model', 'broadlink:0b16', broadlinkDevice);
    assert.calledOnce(gladys.stateManager.get);
  });
});
