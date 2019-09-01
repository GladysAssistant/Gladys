const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const axiosMock = require('../axios.mock.test');

const token = 'gladys-fake-token';

const deviceAPI = proxyquire('../../../../../../services/smartthings/lib/api/device', {
  axios: { request: axiosMock.request, '@global': true },
});

describe('SmartThings API - Device', () => {
  it('create desired device', async () => {
    const newDevice = { name: 'gladys-device' };
    await deviceAPI.create(newDevice, token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/devices',
      method: 'POST',
      data: newDevice,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });

  it('destroy desired device', async () => {
    const newDevice = { name: 'gladys-device', deviceId: 'device-id' };
    await deviceAPI.destroy(newDevice, token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/devices/device-id',
      method: 'DELETE',
      data: undefined,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });

  it('list all devices', async () => {
    await deviceAPI.list(token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/devices',
      method: 'get',
      data: undefined,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });
});
