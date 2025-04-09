const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const { NukiHandlerMock } = require('../../mocks/nuki.mock.test');
const NukiWebApiMock = require('../../mocks/nuki-web-api.mock.test');
const NukiHTTPHandler = proxyquire('../../../../../services/nuki/lib/http', {
'nuki-web-api': NukiWebApiMock 
});

const device = {
  external_id: 'nuki:398172F4',
};

describe('nuki.http.connect command', () => {
  let nukiHttpHandler;

  beforeEach(() => {
    const nukiHandler = new NukiHandlerMock({}, serviceId);
    nukiHttpHandler = new NukiHTTPHandler(nukiHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should initialize http handler with apiKey and build NukiWebApi object', async () => {
    nukiHttpHandler.connect();
    assert.calledOnce(nukiHttpHandler.nukiHandler.getConfiguration);
    

  });
});
