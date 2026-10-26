const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt postDelete', () => {
  let zigbee2mqttManager;
  let gladys;

  const buildGladysDevice = (id, friendlyName, ieeeAddress) => ({
    id,
    name: friendlyName,
    selector: `zigbee2mqtt-${friendlyName}`,
    external_id: `zigbee2mqtt:${friendlyName}`,
    service_id: serviceId,
    features: [
      {
        id: `${id}-feature`,
        selector: `zigbee2mqtt-${friendlyName}-switch-binary-state`,
        external_id: `zigbee2mqtt:${friendlyName}:switch:binary:state`,
        category: 'switch',
        type: 'binary',
      },
    ],
    params: [{ name: 'IEEE_ADDRESS', value: ieeeAddress, device_id: id }],
  });

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      event: {
        emit: fake.returns(null),
      },
      device: {
        get: fake.resolves([]),
        create: fake.resolves(null),
        setParam: fake.resolves(null),
      },
      stateManager: {
        get: fake.returns(null),
        deleteState: fake.returns(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing when no inventory was received from Zigbee2mqtt yet', async () => {
    // EXECUTE
    await zigbee2mqttManager.postDelete(buildGladysDevice('device-id', 'lamp', '0xaaa'));
    // ASSERT
    assert.notCalled(gladys.device.get);
    assert.notCalled(gladys.event.emit);
  });

  it('should apply a rename once the device owning the new name is deleted', async () => {
    // "motion" was renamed "outlet" in Zigbee2mqtt, but "outlet" is still owned in Gladys
    // by a device removed from the Zigbee network: the rename is skipped
    const renamedDevice = buildGladysDevice('motion-id', 'motion', '0xbbb');
    const staleDevice = buildGladysDevice('outlet-id', 'outlet', '0xaaa');
    gladys.device.get = fake.resolves([renamedDevice, staleDevice]);
    const inventory = [{ friendly_name: 'outlet', ieee_address: '0xbbb', type: 'EndDevice' }];
    await zigbee2mqttManager.syncRenamedDevices(inventory);
    assert.notCalled(gladys.device.create);
    assert.notCalled(gladys.device.setParam);
    // The user deletes the stale device, as the log suggests
    gladys.device.get = fake.resolves([renamedDevice]);
    // EXECUTE
    await zigbee2mqttManager.postDelete(staleDevice);
    // ASSERT: the rename is applied right away, without waiting for a new bridge/devices message
    assert.calledOnce(gladys.device.create);
    const createdDevice = gladys.device.create.firstCall.args[0];
    expect(createdDevice.id).to.equal('motion-id');
    expect(createdDevice.external_id).to.equal('zigbee2mqtt:outlet');
    expect(createdDevice.features[0].external_id).to.equal('zigbee2mqtt:outlet:switch:binary:state');
    // The discover page stops offering the renamed device as a new one
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      payload: [],
    });
  });
});
