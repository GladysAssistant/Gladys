const { expect } = require('chai');
const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const AxiosMock = require('./AxiosMock.test');

const packageJson = require('../../../../package.json');

const http = proxyquire('../../../lib/http/http.request.js', {
  axios: AxiosMock,
});

describe('http.request', () => {
  http.system = {
    gladysVersion: `v${packageJson.version}`,
  };
  it('should make a GET request', async () => {
    const response = await http.request('get', 'http://test.test');
    expect(response).to.deep.equal({
      data: {
        success: true,
      },
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
    assert.calledWith(AxiosMock.request, {
      method: 'get',
      url: 'http://test.test',
      timeout: 20000,
      headers: {
        'user-agent': `GladysAssistant/v${packageJson.version}`,
      },
      validateStatus: null,
    });
  });
  it('should make a POST request', async () => {
    const response = await http.request('post', 'http://test.test', { toto: 'toto' }, { authorization: 'TOKEN' });
    expect(response).to.deep.equal({
      data: {
        success: true,
      },
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
    assert.calledWith(AxiosMock.request, {
      method: 'post',
      url: 'http://test.test',
      data: {
        toto: 'toto',
      },
      headers: {
        authorization: 'TOKEN',
        'user-agent': `GladysAssistant/v${packageJson.version}`,
      },
      timeout: 20000,
      validateStatus: null,
    });
  });
});
