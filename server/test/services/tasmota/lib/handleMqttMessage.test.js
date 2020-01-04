const sinon = require('sinon');

const { assert, fake } = sinon;
const { EVENTS } = require('../../../../utils/constants');
const TasmotaHandler = require('../../../../services/tasmota/lib');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};
const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};

describe('Mqtt handle message', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  tasmotaHandler.mqttService = mqttService;

  beforeEach(async () => {
    sinon.reset();
  });

  it('should change TASMOTA power state to ON (POWER topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/POWER', 'ON');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary`,
      state: 1,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA power state to ON (POWER1 topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/POWER1', 'ON');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary:1`,
      state: 1,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA power state to ON (POWER2 topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/POWER2', 'ON');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary:2`,
      state: 1,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA power state to OFF (POWER topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/POWER', 'OFF');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary`,
      state: 0,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA sensor state not handled (SENSOR topic)', () => {
    tasmotaHandler.handleMqttMessage('tele/my_device/SENSOR', '{ "HELLO": { "anything": 125 }}');

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should change TASMOTA sensor state not handled energy (SENSOR topic)', () => {
    tasmotaHandler.handleMqttMessage('tele/my_device/SENSOR', '{ "ENERGY": { "anything": 125 }}');

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should change TASMOTA sensor state energy current to 125 (SENSOR topic)', () => {
    tasmotaHandler.handleMqttMessage('tele/my_device/SENSOR', '{ "ENERGY": { "Current": 125 }}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:energy`,
      state: 125,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA sensor state energy power to 125 (SENSOR topic)', () => {
    tasmotaHandler.handleMqttMessage('tele/my_device/SENSOR', '{ "ENERGY": { "Power": 125 }}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:power`,
      state: 0.125,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA sensor state energy voltage to 125 (SENSOR topic)', () => {
    tasmotaHandler.handleMqttMessage('tele/my_device/SENSOR', '{ "ENERGY": { "Voltage": 125 }}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:voltage`,
      state: 125,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA power state to ON (STATUS topic unknown device)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/STATUS', '{ "Status": { "Power": 1, "FriendlyName": ["name"] }}');

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should change TASMOTA power state to ON (STATUS topic)', () => {
    tasmotaHandler.handleMqttMessage(
      'stat/my_device/STATUS',
      '{ "Status": {"Module": 1, "Power": 1, "FriendlyName": ["name"] }}',
    );

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should change TASMOTA power state to ON (STATE topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/STATE', '{ "POWER": "ON"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary`,
      state: 1,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA power state to OFF (STATE topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/STATE', '{ "POWER": "OFF"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary`,
      state: 0,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA power state to ON (RESULT topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/RESULT', '{ "POWER": "ON"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary`,
      state: 1,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change TASMOTA power state to OFF (RESULT topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/RESULT', '{ "POWER": "OFF"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:my_device:switch:binary`,
      state: 0,
    };

    assert.notCalled(mqttService.device.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should ask for TASMOTA status (LWT topic)', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/LWT', 'anything');

    assert.calledWith(mqttService.device.publish, 'cmnd/my_device/status');
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing on unkown TASMOTA topic', () => {
    tasmotaHandler.handleMqttMessage('stat/my_device/UNKOWN', '{ "POWER": "ON"}');

    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });
});
