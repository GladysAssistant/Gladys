const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

const MockedClient = {
  create: () => {
    return {
      get: (url, options) => {
        let data;
        switch (url) {
          case 'https://apis.groupe-atlantic.com/magellan/accounts/jwt':
            expect(options).to.deep.equals({
              headers: {
                Authorization: 'Bearer access_token',
              },
            });
            data = 'jwt';
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
      post: (url, params, options) => {
        let data;
        switch (url) {
          case 'https://apis.groupe-atlantic.com/token':
            expect(params).equals('username=GA-PRIVATEPERSON%2Fusername&password=password&grant_type=password');
            expect(options).to.deep.equals({
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic COZYTOUCH_CLIENT_ID',
              },
            });
            data = {
              access_token: 'access_token',
            };
            break;
          case 'http://somewhere2/login':
            expect(params).equals('jwt=jwt');
            expect(options).to.deep.equals({
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });
            return {
              success: true,
              headers: {
                'set-cookie': ['cookie# titi'],
              },
            };
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

describe('Overkiz Cozytouch login', () => {
  const server = {
    host: 'http://somewhere',
    endpoint: 'http://somewhere2',
    configuration: {
      COZYTOUCH_ATLANTIC_API: 'https://apis.groupe-atlantic.com',
      COZYTOUCH_CLIENT_ID: 'COZYTOUCH_CLIENT_ID',
    },
  };
  const username = 'username';
  const password = 'password';
  let overkizCozytouch;

  before(() => {
    const OverkizMockCozytouch = proxyquire('../../../../../services/overkiz/lib/client/overkiz.cozytouch', {
      axios: MockedClient,
    });
    overkizCozytouch = new OverkizMockCozytouch.CozytouchLoginHandler(server, username, password);
  });

  it('should Cozytouch login', async () => {
    await overkizCozytouch.login();
    expect(overkizCozytouch.cookie).to.equals('cookie');
  });
});
