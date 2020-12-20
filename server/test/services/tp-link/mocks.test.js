const { stub } = require('sinon');
const { Client } = require('../../../services/tp-link/node_modules/tplink-smarthome-api');

const MockedTpLinkApiClient = stub(Client);

module.exports = { Client: MockedTpLinkApiClient };
