const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const axiosMock = require('../axios.mock.test');

const token = 'gladys-fake-token';

const locationAPI = proxyquire('../../../../../../services/smartthings/lib/api/location', {
  axios: { request: axiosMock.request, '@global': true },
});

describe('SmartThings API - Location', () => {
  it('create desired location', async () => {
    const newLocation = { name: 'gladys-location' };
    await locationAPI.create(newLocation, token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/locations',
      method: 'POST',
      data: newLocation,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });

  it('list all locations', async () => {
    await locationAPI.list(token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/locations',
      method: 'get',
      data: undefined,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });
});
