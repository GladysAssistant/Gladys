const { fake } = require('sinon');

const EventEmitter = require('events');

const event = new EventEmitter();

const mqttApi = Object.assign(event, {
  disconnected: true,
  subscribe: fake.resolves(null),
  _end: fake.resolves(null),
  end: () => {
    mqttApi.disconnected = true;
    mqttApi._end();
  }
});

const MockedMqttClient = {
  _connect: fake.returns(mqttApi),
  connect: () => {
    mqttApi.disconnected = false;
    return MockedMqttClient._connect();
  }
};

module.exports = {
  MockedMqttClient,
  event,
};
