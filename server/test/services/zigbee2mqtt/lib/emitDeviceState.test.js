const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt emitDeviceState', () => {
  let zigbee2mqttManager;
  let gladys;

  const device = {
    external_id: 'zigbee2mqtt:salon/lampe',
    features: [
      {
        external_id: 'zigbee2mqtt:salon/lampe:light:binary:state',
        type: 'binary',
      },
    ],
  };

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => func,
      },
      event: {
        emit: fake.returns(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.discoveredDevices['salon/lampe'] = {
      friendly_name: 'salon/lampe',
      definition: {
        exposes: [
          {
            type: 'light',
            features: [{ type: 'binary', name: 'state', property: 'state', value_on: 'ON', value_off: 'OFF' }],
          },
        ],
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should save the value in the matching feature', () => {
    // EXECUTE
    zigbee2mqttManager.emitDeviceState(device, 'salon/lampe', 'state', 'ON');
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:salon/lampe:light:binary:state',
      state: 1,
    });
  });

  it('should save a value received earlier at the date it was received', () => {
    // EXECUTE
    zigbee2mqttManager.emitDeviceState(device, 'salon/lampe', 'state', 'OFF', '2026-11-15T09:00:00.000Z');
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:salon/lampe:light:binary:state',
      state: 0,
      created_at: '2026-11-15T09:00:00.000Z',
    });
  });

  it('should ignore a property without feature in Gladys', () => {
    // PREPARE
    const debugStub = sinon.stub(logger, 'debug');
    // EXECUTE
    zigbee2mqttManager.emitDeviceState(device, 'salon/lampe', 'linkquality', 120);
    // ASSERT
    assert.calledOnceWithExactly(
      debugStub,
      'Zigbee2mqtt device salon/lampe, feature linkquality not configured in Gladys.',
    );
    assert.notCalled(gladys.event.emit);
  });

  it('should log a value that cannot be converted, without saving it', () => {
    // PREPARE
    const errorStub = sinon.stub(logger, 'error');
    // EXECUTE
    zigbee2mqttManager.emitDeviceState(device, 'salon/lampe', 'state', 'BLINK');
    // ASSERT
    assert.calledOnce(errorStub);
    assert.calledWithMatch(errorStub, 'Failed to convert value for device salon/lampe:');
    assert.notCalled(gladys.event.emit);
  });
});
