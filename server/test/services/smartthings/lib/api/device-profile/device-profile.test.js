const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const axiosMock = require('../axios.mock.test');

const token = 'gladys-fake-token';

const deviceProfileAPI = proxyquire('../../../../../../services/smartthings/lib/api/device-profile', {
  axios: { request: axiosMock.request, '@global': true },
});

describe('SmartThings API - Device Profile', () => {
  it('create desired device profile', async () => {
    const newDeviceProfile = { name: 'gladys-device-profil' };
    await deviceProfileAPI.create(newDeviceProfile, token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/deviceprofiles',
      method: 'POST',
      data: newDeviceProfile,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });

  it('destroy desired device profile', async () => {
    const newDeviceProfile = { name: 'gladys-device-profil', id: 'device-profile-id' };
    await deviceProfileAPI.destroy(newDeviceProfile, token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/deviceprofiles/device-profile-id',
      method: 'DELETE',
      data: undefined,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });

  it('list all device profiles', async () => {
    await deviceProfileAPI.list(token);

    const expectedRequestParam = {
      baseURL: 'https://api.smartthings.com/v1',
      headers: {
        Bearer: token,
      },
      url: '/deviceprofiles',
      method: 'get',
      data: undefined,
    };
    assert.calledWith(axiosMock.request, expectedRequestParam);
  });
});
