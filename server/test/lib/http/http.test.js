const { expect } = require('chai');
const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const AxiosMock = require('./AxiosMock.test');

const http = proxyquire('../../../lib/http/http.request.js', {
  axios: AxiosMock,
});

describe('http.request', () => {
  it('should make a GET request', async () => {
    const response = await http.request('get', 'http://test.test');
    expect(response).to.deep.equal({
      success: true,
    });
    assert.calledWith(AxiosMock.request, {
      method: 'get',
      url: 'http://test.test',
      timeout: 60000,
    });
  });
  it('should make a POST request', async () => {
    const response = await http.request('post', 'http://test.test', { toto: 'toto' }, { authorization: 'TOKEN' });
    expect(response).to.deep.equal({
      success: true,
    });
    assert.calledWith(AxiosMock.request, {
      method: 'post',
      url: 'http://test.test',
      data: {
        toto: 'toto',
      },
      headers: {
        authorization: 'TOKEN',
      },
      timeout: 60000,
    });
  });
});
