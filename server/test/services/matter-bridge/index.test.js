const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const MatterBridgeMock = sinon.stub();
MatterBridgeMock.prototype.start = sinon.stub().resolves();
MatterBridgeMock.prototype.stop = sinon.stub().resolves();

const MatterBridgeService = proxyquire('../../../services/matter-bridge/index', {
  './lib/MatterBridge': MatterBridgeMock,
  '@matter/main': { name: 'main' },
  '@matter/main/devices': { name: 'devices' },
  '@matter/main/endpoints': { name: 'endpoints' },
  '@matter/main/behaviors': { name: 'behaviors' },
});

describe('MatterBridgeService', () => {
  const gladys = {};
  const service = MatterBridgeService(gladys, 'service-id');

  afterEach(() => {
    sinon.resetHistory();
  });

  it('should hand the bridge a loader of the matter.js modules, not the modules', () => {
    sinon.assert.calledOnceWithExactly(MatterBridgeMock, gladys, 'service-id', sinon.match.func);
    const loadMatter = MatterBridgeMock.firstCall.args[2];
    expect(loadMatter()).to.deep.equal({
      main: { name: 'main' },
      devices: { name: 'devices' },
      endpoints: { name: 'endpoints' },
      behaviors: { name: 'behaviors' },
    });
    expect(service.controllers).to.have.property('get /api/v1/service/matter-bridge/status');
  });

  it('should start the bridge', async () => {
    await service.start();
    sinon.assert.calledOnce(service.bridge.start);
  });

  it('should stop the bridge', async () => {
    await service.stop();
    sinon.assert.calledOnce(service.bridge.stop);
  });
});
