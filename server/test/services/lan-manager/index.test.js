const sinon = require('sinon');

const { assert, fake, stub } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const ArppingMock = stub();

const LANManagerService = proxyquire('../../../services/lan-manager', {
  arpping: ArppingMock,
});

const gladys = {};

describe('LANManagerService', () => {
  beforeEach(() => {
    ArppingMock.prototype.discover = fake.resolves([]);
    gladys.event = {
      emit: fake.returns(true),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  const lanManagerService = LANManagerService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  const { lanDiscovery } = lanManagerService.device;

  it('should start service', async () => {
    await lanManagerService.start();
    assert.calledOnceWithExactly(lanDiscovery.discover);
  });

  it('should stop service', async () => {
    lanManagerService.stop();
    assert.notCalled(lanDiscovery.discover);
  });
});
