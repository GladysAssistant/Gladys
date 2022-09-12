const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const broadlinkMock = {};

const BroadlinkService = proxyquire('../../../services/broadlink', {
  'node-broadlink': broadlinkMock,
});

const gladys = {};

describe('BroadlinkService', () => {
  beforeEach(() => {
    broadlinkMock.discover = fake.resolves([]);
  });
  afterEach(() => {
    sinon.reset();
  });

  const broadlinkService = BroadlinkService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  const { broadlink } = broadlinkService.device;

  it('should start service', async () => {
    await broadlinkService.start();
    assert.calledOnceWithExactly(broadlink.discover);
  });

  it('should stop service', async () => {
    broadlinkService.stop();
    assert.notCalled(broadlink.discover);
  });
});
