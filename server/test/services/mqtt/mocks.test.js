const { fake } = require('sinon');

const EventEmitter = require('events');

const event = new EventEmitter();

const mqttApi = Object.assign(event, {
  disconnected: true,
  subscribe: fake.resolves(null),
  unsubscribe: fake.resolves(null),
  publish: fake.yieldsAsync(null),
  internalEnd: fake.resolves(null),
  end: () => {
    mqttApi.disconnected = true;
    mqttApi.internalEnd();
  },
});

const MockedMqttClient = {
  internalConnect: fake.returns(mqttApi),
  connect: () => {
    mqttApi.disconnected = false;
    return MockedMqttClient.internalConnect();
  },
};

module.exports = {
  MockedMqttClient,
  mqttApi,
  event,
};
