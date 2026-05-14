const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { serviceId } = require('../../mocks/consts.test');
const { NukiHandlerMock } = require('../../mocks/nuki.mock.test');
const { NukiWebApiMock } = require('../../mocks/nuki-web-api.mock.test');

const NukiHTTConnect = proxyquire('../../../../../services/nuki/lib/http/nuki.http.connect.js', {
  'nuki-web-api': NukiWebApiMock,
});

const NukiHTTPHandler = proxyquire('../../../../../services/nuki/lib/http', {
  './nuki.http.connect.js': NukiHTTConnect,
});

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
    await nukiHttpHandler.connect();
    assert.calledOnce(nukiHttpHandler.nukiHandler.getStatus);
    assert.calledOnce(nukiHttpHandler.nukiHandler.getConfiguration);
  });

  it('should not initialize http handler since apiKey is not set', async () => {
    nukiHttpHandler.nukiHandler.getStatus = fake.resolves({
      mqttOk: false,
      webOk: false,
    });
    await nukiHttpHandler.connect();
    assert.calledOnce(nukiHttpHandler.nukiHandler.getStatus);
    assert.notCalled(nukiHttpHandler.nukiHandler.getConfiguration);
    expect(nukiHttpHandler.nukiApi).deep.eq(undefined);
  });
});
