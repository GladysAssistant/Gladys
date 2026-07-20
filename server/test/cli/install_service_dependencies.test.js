const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('install_service_dependencies', () => {
  let execStub;
  let installServiceDependencies;

  beforeEach(() => {
    execStub = sinon.stub().resolves();
    ({ installServiceDependencies } = proxyquire('../../cli/install_service_dependencies', {
      '../utils/childProcess': { exec: execStub },
      '../utils/logger': {
        info: sinon.stub(),
        warn: sinon.stub(),
      },
      fs: {
        readdirSync: sinon.stub().returns([
          { isDirectory: () => true, name: 'mqtt' },
          { isDirectory: () => true, name: 'telegram' },
        ]),
      },
    }));
  });

  afterEach(() => {
    delete process.env.INSTALL_SERVICES_SILENT_FAIL;
  });

  it('should install dependencies for each service with concurrency of 4', async () => {
    await installServiceDependencies();

    expect(execStub.callCount).to.equal(2);
    expect(execStub.firstCall.args[0]).to.include('/services/mqtt');
    expect(execStub.secondCall.args[0]).to.include('/services/telegram');
  });

  it('should ignore install errors when silent fail is enabled', async () => {
    execStub.onFirstCall().rejects(new Error('install failed'));
    process.env.INSTALL_SERVICES_SILENT_FAIL = 'true';

    await installServiceDependencies();

    expect(execStub.callCount).to.equal(2);
  });

  it('should throw when silent fail is disabled', async () => {
    execStub.onFirstCall().rejects(new Error('install failed'));

    let error;
    try {
      await installServiceDependencies();
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an('error');
    expect(error.message).to.equal('install failed');
  });
});
