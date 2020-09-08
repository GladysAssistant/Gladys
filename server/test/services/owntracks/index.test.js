const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const OwntracksMock = require('./owntracks.mock.test');

const OwntracksService = proxyquire('../../../services/owntracks/index', {
  './lib': OwntracksMock,
});

describe.only('OwntracksService', () => {
  const owntracksService = OwntracksService({}, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await owntracksService.start();
    assert.calledOnce(owntracksService.device.connect);
    assert.notCalled(owntracksService.device.disconnect);
  });

  it('should stop service', async () => {
    owntracksService.stop();
    assert.notCalled(owntracksService.device.connect);
    assert.calledOnce(owntracksService.device.disconnect);
  });
});
