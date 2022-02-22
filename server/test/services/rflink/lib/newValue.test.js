const sinon = require('sinon');

const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');
const DEVICES = require('./devicesToTest.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake } = sinon;
const { EVENTS } = require('../../../../utils/constants');

describe('RFLinkHandler.newValue', () => {
  let gladys;
  let rflinkHandler;

  beforeEach(() => {
    sinon.reset();
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  });

  it('should update a device with a new value state ON', async () => {
    const device = DEVICES[0];
    const deviceFeature = 'temperature';
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
      state: 0.1,
    });
  });

  it('should update a device with a new value with a default state', async () => {
    const device = DEVICES[0];
    const deviceFeature = 'default';
    const state = 'default';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
      state: 'default',
    });
  });

  it('should update a device with a new value state OFF', async () => {
    const device = DEVICES[0];
    const deviceFeature = 'temperature';
    const state = 'OFF';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
      state: 0.0,
    });
  });

  it('should update a device with a new value of battery', async () => {
    const device = DEVICES[0];
    const deviceFeature = 'battery';
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
      state: 'NA',
    });
  });

  it('should update a device with a new light-intensity', async () => {
    const device = DEVICES[0];
    const deviceFeature = 'light-intensity';
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
      state: 1,
    });
  });

  it('should update a device with a new uv value', async () => {
    const device = DEVICES[0];
    const deviceFeature = 'uv';
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
      state: 1,
    });
  });

  it('should update a device with a new pressure', async () => {
    const device = DEVICES[0];
    const deviceFeature = 'pressure';
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`,
      state: 1,
    });
  });

  it('should not update a device on a undefined feature', async () => {
    const device = DEVICES[0];
    const deviceFeature = undefined;
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);
    assert.notCalled(gladys.event.emit);
  });

  it('should not update a device on a undefined device id', async () => {
    const device = DEVICES[0];
    device.id = undefined;
    const deviceFeature = 'pressure';
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);
    assert.notCalled(gladys.event.emit);
  });
});
