const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const axiosMock = require('../axios.mock.test');

const token = 'gladys-fake-token';

const appAPI = proxyquire('../../../../../../services/smartthings/lib/api/app', {
  axios: { request: axiosMock.request, '@global': true },
});

describe('SmartThings API - App', () => {
  it('create desired app by name', async () => {
    const newApp = { name: 'gladys-app' };
    await appAPI.create(newApp, token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/apps',
      method: 'POST',
      data: newApp,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });

  it('get desired app by name', async () => {
    await appAPI.get('gladys-app', token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/apps/gladys-app',
      method: 'get',
      data: undefined,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });
});
