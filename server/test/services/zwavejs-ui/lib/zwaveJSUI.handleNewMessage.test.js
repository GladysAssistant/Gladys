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
      'zwave/living-room/my-sensor/notification/endpoint_0/Access_Control/Door_state_simple',
      '{"time":1702654592227,"value":22, "nodeId": 2}',
    );
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
      state: 0,
    });
  });
  it('should save a new closed value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    await zwaveJSUIHandler.handleNewMessage(
      'zwave/living-room/my-sensor/notification/endpoint_0/Access_Control/Door_state_simple',
      '{"time":1702654592227,"value":23, "nodeId": 2}',
    );
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
      state: 1,
    });
  });
});
