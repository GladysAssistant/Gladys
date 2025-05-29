const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { serviceId } = require('../../mocks/consts.test');
const { NukiHandlerMock } = require('../../mocks/nuki.mock.test');
const { NukiWebApiMock } = require('../../mocks/nuki-web-api.mock.test');

const NukiHTTPHandler = proxyquire('../../../../../services/nuki/lib/http', {
  'nuki-web-api': NukiWebApiMock,
});

describe('nuki.http.scan command', () => {
  let nukiHttpHandler;

  beforeEach(() => {
    const nukiHandler = new NukiHandlerMock({}, serviceId);
    nukiHttpHandler = new NukiHTTPHandler(nukiHandler);
    nukiHttpHandler.nukiApi = new NukiWebApiMock('test123');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get one smart lock device through nuki web api', async () => {
    await nukiHttpHandler.scan();
    assert.calledOnce(nukiHttpHandler.nukiHandler.notifyNewDevice);
  });

  it('should get no smart lock device through nuki web api', async () => {
    nukiHttpHandler.nukiApi.getSmartlocks = fake.returns(null);
    await nukiHttpHandler.scan();
    assert.notCalled(nukiHttpHandler.nukiHandler.notifyNewDevice);
  });

  it('should raise an error since something went wrong with nuki web api', async () => {
    const error = fake.throws(new Error('error'));
    nukiHttpHandler.nukiApi.getSmartlocks = error;
    try {
      await nukiHttpHandler.scan();
      assert.fail();
    } catch (e) {
      assert.calledOnce(error);
    }
  });
});
