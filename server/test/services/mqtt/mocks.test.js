const sinon = require('sinon').createSandbox();

const { fake } = sinon;

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

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
