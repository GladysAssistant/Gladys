const sinon = require('sinon');

const { assert, fake } = sinon;
const { EVENTS } = require('../../../../utils/constants');
const SonoffHandler = require('../../../../services/sonoff/lib');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};
const mqttService = {
  client: {
    publish: fake.returns(null),
  },
};

describe('Mqtt handle message', () => {
  const sonoffHandler = new SonoffHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  sonoffHandler.mqttService = mqttService;

  beforeEach(async () => {
    sinon.reset();
  });

  it('should change SONOFF power state to ON (POWER topic)', () => {
    sonoffHandler.handleMqttMessage('stat/sonoff/POWER', 'ON');

    const expectedEvent = {
      device_feature_external_id: `sonoff:switch:binary`,
      state: 1,
    };

    assert.notCalled(mqttService.client.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change SONOFF power state to OFF (POWER topic)', () => {
    sonoffHandler.handleMqttMessage('stat/sonoff/POWER', 'OFF');

    const expectedEvent = {
      device_feature_external_id: `sonoff:switch:binary`,
      state: 0,
    };

    assert.notCalled(mqttService.client.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change SONOFF sensor state to 125 (SENSOR topic)', () => {
    sonoffHandler.handleMqttMessage('tele/sonoff/SENSOR', '{ "ENERGY": { "Current": 125 }}');

    const expectedEvent = {
      device_feature_external_id: `sonoff:switch:power`,
      state: 125,
    };

    assert.notCalled(mqttService.client.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change SONOFF power state to ON (STATUS topic)', () => {
    sonoffHandler.handleMqttMessage('stat/sonoff/STATUS', '{ "Status": { "Power": 1, "FriendlyName": ["name"] }}');

    const expectedEvent = {
      device_feature_external_id: `sonoff:switch:binary`,
      state: 1,
    };

    assert.notCalled(mqttService.client.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change SONOFF power state to ON (STATE topic)', () => {
    sonoffHandler.handleMqttMessage('stat/sonoff/STATE', '{ "POWER": "ON"}');

    const expectedEvent = {
      device_feature_external_id: `sonoff:switch:binary`,
      state: 1,
    };

    assert.notCalled(mqttService.client.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should change SONOFF power state to OFF (STATE topic)', () => {
    sonoffHandler.handleMqttMessage('stat/sonoff/STATE', '{ "POWER": "OFF"}');

    const expectedEvent = {
      device_feature_external_id: `sonoff:switch:binary`,
      state: 0,
    };

    assert.notCalled(mqttService.client.publish);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('should ask for SONOFF status (LWT topic)', () => {
    sonoffHandler.handleMqttMessage('stat/sonoff/LWT', 'anything');

    assert.calledWith(mqttService.client.publish, 'cmnd/sonoff/status');
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing on unkown SONOFF topic', () => {
    sonoffHandler.handleMqttMessage('stat/sonoff/UNKOWN', '{ "POWER": "ON"}');

    assert.notCalled(mqttService.client.publish);
    assert.notCalled(gladys.event.emit);
  });
});
