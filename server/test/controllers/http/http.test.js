const { expect } = require('chai');
const nock = require('nock');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/http/request', () => {
  it('should make GET HTTP request', async () => {
    const scope = nock('http://test-http-request.com')
      .get('/test/request')
      .reply(200, {
        hey: 'you',
      });
    await authenticatedRequest
      .post('/api/v1/http/request')
      .send({
        method: 'get',
        url: 'http://test-http-request.com/test/request',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          data: { hey: 'you' },
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      });
    expect(scope.isDone()).to.equal(true);
  });
  it('should make GET HTTP request on non json route', async () => {
    const scope = nock('http://test-http-request.com')
      .get('/test/html')
      .reply(200, '<html></html>', { 'content-type': 'text/html; charset=utf-8' });
    await authenticatedRequest
      .post('/api/v1/http/request')
      .send({
        method: 'get',
        url: 'http://test-http-request.com/test/html',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          data: '<html></html>',
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      });
    expect(scope.isDone()).to.equal(true);
  });
  it('should make POST HTTP request', async () => {
    const scope = nock('http://test-http-request.com')
      .post('/test/request/post', {
        yo: 'yo',
      })
      .reply(201, {
        oh: 'uh',
      });
    await authenticatedRequest
      .post('/api/v1/http/request')
      .send({
        method: 'post',
        url: 'http://test-http-request.com/test/request/post',
        body: {
          yo: 'yo',
        },
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          data: { oh: 'uh' },
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      });
    expect(scope.isDone()).to.equal(true);
  });
});
