const sinon = require('sinon');

const { assert, fake } = sinon;

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
};

describe('zwaveJSUIHandler.handleNewMessage', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save nodes received', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    const data = {
      result: [],
    };
    await zwaveJSUIHandler.handleNewMessage(
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes',
      JSON.stringify(data),
    );
  });
  it('should not crash even with broken JSON', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    await zwaveJSUIHandler.handleNewMessage('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes', 'toto');
  });
  it('should save a new open value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    await zwaveJSUIHandler.handleNewMessage(
      'zwave/_EVENTS/ZWAVE_GATEWAY-zwave-js-ui/node/node_value_updated',
      '{"data": [{"name": "my-sensor", "location": "living-room"}, {"commandClassName": "Notification","commandClass": 113,"property": "Access Control","endpoint": 0,"newValue": 22,"prevValue": 23,"propertyName": "Access Control", "propertyKey": "Door state (simple)"}]}',
    );
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:living-room:my-sensor:0:notification:access_control:door_state_simple',
      state: 0,
    });
  });
  it('should save a new closed value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    await zwaveJSUIHandler.handleNewMessage(
      'zwave/_EVENTS/ZWAVE_GATEWAY-zwave-js-ui/node/node_value_updated',
      '{"data": [{"name": "my-sensor", "location": "living-room"}, {"commandClassName": "Notification","commandClass": 113,"property": "Access Control","endpoint": 0,"newValue": 23,"prevValue": 22,"propertyName": "Access Control", "propertyKey": "Door state (simple)"}]}',
    );
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:living-room:my-sensor:0:notification:access_control:door_state_simple',
      state: 1,
    });
  });
});
