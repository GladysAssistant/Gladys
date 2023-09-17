const sinon = require('sinon');
const { expect } = require('chai');
const { AxiosError } = require('axios');

const { stub, assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const MockedClient = {
  create: () => {
    return {
      interceptors: {
        request: {
          use: stub(),
        },
      },
      get: (url) => {
        let data;
        switch (url) {
          case '/setup':
            data = { action: 'setup' };
            break;
          case '/setup/gateways':
            data = { action: 'gateways' };
            break;
          case '/setup/devices':
            data = { action: 'devices' };
            break;
          default:
            data = {};
        }
        return {
          data,
        };
      },
      post: (url, body) => {
        let data;
        switch (url) {
          case '/exec/apply':
            if (body && body.error && body.error === '401') {
              delete body.error;
              throw new AxiosError('ERROR', 'ERROR', null, null, {
                data: '',
                status: 401,
                statusText: 'Not authorized',
                headers: undefined,
                config: undefined,
              });
            } else if (body && body.error) {
              throw new Error(body.error);
            } else {
              data = { execId: '0123456789' };
            }
            break;
          default:
            data = {};
        }
        return {
          data,
        };
      },
    };
  },
};

describe('Overkiz API', () => {
  const host = 'http://somewhere';
  const polling = {};
  let overkizAPI;

  before(() => {
    const OverkizMockAPI = proxyquire('../../../../../services/overkiz/lib/client/overkiz.api', {
      axios: MockedClient,
    });
    overkizAPI = new OverkizMockAPI.API({
      host,
      platformLoginHandler: {
        login: stub(),
        cookie: '',
      },
      polling,
    });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should API getSetup', async () => {
    const setup = await overkizAPI.getSetup();
    expect(setup).to.deep.equals({ action: 'setup' });
  });

  it('should API getGateways', async () => {
    const gateways = await overkizAPI.getGateways();
    expect(gateways).to.deep.equals({ action: 'gateways' });
  });

  it('should API getDevices', async () => {
    const devices = await overkizAPI.getDevices();
    expect(devices).to.deep.equals({ action: 'devices' });
  });

  it('should API exec', async () => {
    const execId = await overkizAPI.exec({});
    expect(execId).to.equals('0123456789');
  });

  it('should API not logged', async () => {
    overkizAPI.platformLoginHandler.cookie = undefined;
    const setup = await overkizAPI.getSetup({});
    assert.calledOnce(overkizAPI.platformLoginHandler.login);
    expect(setup).to.deep.equals({ action: 'setup' });
  });

  it('should API error', async () => {
    try {
      await overkizAPI.exec({ error: 'ERROR' });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
    }
  });

  it('should API error 401', async () => {
    const execId = await overkizAPI.exec({ error: '401' });
    // TODO Should be called once if modify MockClient response
    assert.calledTwice(overkizAPI.platformLoginHandler.login);
    expect(execId).to.equals('0123456789');
  });
});
