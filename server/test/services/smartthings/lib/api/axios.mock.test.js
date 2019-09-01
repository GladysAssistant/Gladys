const { fake } = require('sinon');

const axiosMock = {
  request: fake.resolves(true),
};

module.exports = axiosMock;
