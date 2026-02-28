const sinon = require('sinon');

const { fake } = sinon;

const mqttService = {
  isUsed: fake.resolves(true),
  device: {
    publish: fake.returns(true),
    subscribe: fake.returns(true),
    unsubscribe: fake.returns(true),
  },
};

module.exports = {
  mqttService,
};
