const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const SonoffMock = require('./sonoff.mock.test');

const SonoffService = proxyquire('../../../services/sonoff/index', {
  './lib': SonoffMock,
});

describe('SonoffService', () => {
  const sonoffService = SonoffService({}, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await sonoffService.start();
    assert.calledOnce(sonoffService.client.connect);
    assert.notCalled(sonoffService.client.disconnect);
  });

  it('should stop service', async () => {
    sonoffService.stop();
    assert.notCalled(sonoffService.client.connect);
    assert.calledOnce(sonoffService.client.disconnect);
  });
});
