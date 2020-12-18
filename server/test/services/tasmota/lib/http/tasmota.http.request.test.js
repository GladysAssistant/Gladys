const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const EventEmitter = require('events');

const { fake, assert } = sinon;

const req = {
  on: fake.returns(null),
  end: fake.returns(null),
};
const res = new EventEmitter();
const HttpMock = {
  get: (url, callback) => {
    switch (url) {
      case 'auth-error': {
        res.statusCode = 401;
        break;
      }
      case 'error': {
        res.statusCode = 404;
        break;
      }
      default:
        res.statusCode = 200;
    }

    callback(res);
    return req;
  },
};

const { request, buildUrl } = proxyquire('../../../../../services/tasmota/lib/http/tasmota.http.request', {
  http: HttpMock,
});

describe('Tasmota - HTTP - request', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('request with auth-error', () => {
    const url = 'auth-error';
    const dataCallback = fake.resolves(null);
    const authErrorCallback = fake.resolves(null);
    const errorCallback = fake.resolves(null);

    request(url, dataCallback, authErrorCallback, errorCallback);
    res.emit('data', '{ "data": "any" }');

    assert.notCalled(dataCallback);
    assert.calledOnce(authErrorCallback);
    assert.notCalled(errorCallback);

    assert.calledOnce(req.on);
    assert.calledOnce(req.end);
  });

  it('request with auth-error on response', () => {
    const url = 'success';
    const dataCallback = fake.resolves(null);
    const authErrorCallback = fake.resolves(null);
    const errorCallback = fake.resolves(null);

    request(url, dataCallback, authErrorCallback, errorCallback);
    res.emit('data', '{ "WARNING": "any" }');

    assert.notCalled(dataCallback);
    assert.calledOnce(authErrorCallback);
    assert.notCalled(errorCallback);

    assert.calledOnce(req.on);
    assert.calledOnce(req.end);
  });

  it('request with error', () => {
    const url = 'error';
    const dataCallback = fake.resolves(null);
    const authErrorCallback = fake.resolves(null);
    const errorCallback = fake.resolves(null);

    request(url, dataCallback, authErrorCallback, errorCallback);
    res.emit('data', '{ "data": "any" }');

    assert.notCalled(dataCallback);
    assert.notCalled(authErrorCallback);
    assert.calledOnce(errorCallback);

    assert.calledOnce(req.on);
    assert.calledOnce(req.end);
  });

  it('request with success', () => {
    const url = 'success';
    const dataCallback = fake.resolves(null);
    const authErrorCallback = fake.resolves(null);
    const errorCallback = fake.resolves(null);

    request(url, dataCallback, authErrorCallback, errorCallback);
    res.emit('data', '{ "data": "any" }');

    assert.calledOnce(dataCallback);
    assert.notCalled(authErrorCallback);
    assert.notCalled(errorCallback);

    assert.calledOnce(req.on);
    assert.calledOnce(req.end);
  });
});

describe('Tasmota - HTTP - buildUrl', () => {
  it('buildUrl with device no username', () => {
    const device = {
      external_id: 'tasmota:my-url',
      params: [],
    };

    const result = buildUrl(device);
    expect(result).to.eq('http://my-url/');
  });

  it('buildUrl with device and username', () => {
    const device = {
      external_id: 'tasmota:my-url',
      params: [
        {
          name: 'username',
          value: 'BOB',
        },
      ],
    };

    const result = buildUrl(device);
    expect(result).to.eq('http://my-url/?user=BOB');
  });

  it('buildUrl with device and username/password', () => {
    const device = {
      external_id: 'tasmota:my-url',
      params: [
        {
          name: 'username',
          value: 'BOB',
        },
        {
          name: 'password',
          value: 'PASS',
        },
      ],
    };

    const result = buildUrl(device, 'CMND');
    expect(result).to.eq('http://my-url/cm?user=BOB&password=PASS&cmnd=CMND');
  });
});
