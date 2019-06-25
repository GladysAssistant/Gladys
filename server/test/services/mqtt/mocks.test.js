const { fake } = require('sinon');

const EventEmitter = require('events');

const event = new EventEmitter();

const mqttApi = Object.assign(event, {
  subscribe: fake.resolves(null),
});

const MockedMqttClient = {
  connect: fake.returns(mqttApi),
};

module.exports = {
  MockedMqttClient,
  event,
};
