const sinon = require('sinon');
const { expect } = require('chai');

const { stub } = sinon;
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
      post: (url) => {
        let data;
        switch (url) {
          case '/exec/apply':
            data = { execId: '0123456789' };
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
});
