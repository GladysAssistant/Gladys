const { fake } = require('sinon');

const Api = {
  getThermostatsData: fake.resolves(null)
};

module.exports = Api;
