const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const { MockedBroadlinkClient } = require('./mocks.test');

const BroadlinkService = proxyquire('../../../services/broadlink', {
  'broadlink-js': MockedBroadlinkClient,
});

const gladys = {};

describe('BroadlinkService', () => {
  beforeEach(() => {
    sinon.reset();
  });

  const broadlinkService = BroadlinkService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  const { broadlink } = broadlinkService.device;

  it('should start service', async () => {
    await broadlinkService.start();
    assert.calledOnce(broadlink.discover);
    assert.calledWith(broadlink.on, 'discover');
    assert.notCalled(broadlink.removeAllListeners);
  });

  it('should stop service', async () => {
    broadlinkService.stop();
    assert.notCalled(broadlink.discover);
    assert.notCalled(broadlink.on);
    assert.calledOnce(broadlink.removeAllListeners);
  });
});
