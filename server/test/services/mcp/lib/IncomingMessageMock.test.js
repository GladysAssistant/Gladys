const { expect } = require('chai');
const { fake } = require('sinon');
const { IncomingMessageMock } = require('../../../../services/mcp/lib/IncomingMessageMock');

describe('IncomingMessageMock', () => {
  it('should initialize with provided values', () => {
    const method = 'POST';
    const headers = {
      'content-type': 'application/json',
      'x-custom-header': 'test-value',
    };
    const body = JSON.stringify({ test: 'data' });

    const request = new IncomingMessageMock(method, headers, body);

    expect(request.method).to.eq(method);
    expect(request.url).to.eq('http://localhost/mock');
    expect(request.body).to.eq(body);
    expect(request.listeners).to.deep.equal({});
    expect(request.reloadNavigation).to.eq(false);
  });

  it('should create rawHeaders array', () => {
    const headers = {
      'content-type': 'application/json',
      'x-custom-header': 'test-value',
    };

    const request = new IncomingMessageMock('GET', headers, '');

    expect(request.rawHeaders).to.deep.equal(['content-type', 'application/json', 'x-custom-header', 'test-value']);
  });

  it('should register event listeners with on() method', () => {
    const request = new IncomingMessageMock('GET', {}, '');

    const dataListener = fake();
    const endListener = fake();

    request.on('data', dataListener);
    request.on('end', endListener);

    expect(request.listeners.data).to.eq(dataListener);
    expect(request.listeners.end).to.eq(endListener);
  });

  it('should parse JSON body with json() method', () => {
    const bodyObject = {
      message: 'Hello',
      count: 42,
      nested: { value: true },
    };
    const bodyString = JSON.stringify(bodyObject);

    const request = new IncomingMessageMock('POST', {}, bodyString);

    const parsed = request.json();

    expect(parsed).to.deep.equal(bodyObject);
  });

  it('should return this when calling destroy()', () => {
    const request = new IncomingMessageMock('GET', {}, '');

    const result = request.destroy();

    expect(result).to.eq(request);
  });
});
