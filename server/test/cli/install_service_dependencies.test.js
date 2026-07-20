const { expect } = require('chai');
const sinon = require('sinon');

const {
  DEFAULT_CONCURRENCY,
  getServiceDirectories,
  installServiceDependencies,
  runCli,
} = require('../../cli/install_service_dependencies');

describe('install_service_dependencies', () => {
  describe('DEFAULT_CONCURRENCY', () => {
    it('should default to 4 parallel installs', () => {
      expect(DEFAULT_CONCURRENCY).to.equal(4);
    });
  });

  describe('getServiceDirectories', () => {
    it('should return only directories', () => {
      const readdirSyncFn = sinon.stub().returns([
        { isDirectory: () => true, name: 'mqtt' },
        { isDirectory: () => false, name: 'index.js' },
        { isDirectory: () => true, name: 'telegram' },
      ]);

      const directories = getServiceDirectories('/services', readdirSyncFn);

      expect(directories).to.deep.equal(['/services/mqtt', '/services/telegram']);
      expect(readdirSyncFn.calledOnce).to.equal(true);
    });
  });

  describe('installServiceDependencies', () => {
    const serviceNames = ['service-a', 'service-b', 'service-c', 'service-d', 'service-e', 'service-f'];

    /**
     * @description Build fake service directory entries for tests.
     * @returns {Array<object>} Fake directory entries.
     * @example
     * buildServiceEntries();
     */
    function buildServiceEntries() {
      return serviceNames.map((name) => ({
        isDirectory: () => true,
        name,
      }));
    }

    it('should install dependencies for every service directory', async () => {
      const execFn = sinon.stub().resolves();
      const loggerInstance = {
        info: sinon.stub(),
        warn: sinon.stub(),
      };

      await installServiceDependencies({
        servicePath: '/services',
        readdirSyncFn: sinon.stub().returns(buildServiceEntries()),
        execFn,
        loggerInstance,
        concurrency: 4,
        silentFail: true,
      });

      expect(execFn.callCount).to.equal(serviceNames.length);
      serviceNames.forEach((serviceName) => {
        expect(execFn.calledWith(`cd /services/${serviceName} && npm install --unsafe-perm`)).to.equal(true);
      });
    });

    it('should run at most 4 installs in parallel', async () => {
      let concurrentInstalls = 0;
      let maxConcurrentInstalls = 0;

      const execFn = sinon.stub().callsFake(async () => {
        concurrentInstalls += 1;
        maxConcurrentInstalls = Math.max(maxConcurrentInstalls, concurrentInstalls);
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
        concurrentInstalls -= 1;
      });

      await installServiceDependencies({
        servicePath: '/services',
        readdirSyncFn: sinon.stub().returns(buildServiceEntries()),
        execFn,
        loggerInstance: {
          info: sinon.stub(),
          warn: sinon.stub(),
        },
        concurrency: 4,
        silentFail: true,
      });

      expect(maxConcurrentInstalls).to.be.at.most(4);
      expect(maxConcurrentInstalls).to.be.at.least(2);
    });

    it('should ignore install errors when silent fail is enabled', async () => {
      const execFn = sinon.stub().callsFake(async (command) => {
        if (command.includes('service-b')) {
          throw new Error('install failed');
        }
      });

      const loggerInstance = {
        info: sinon.stub(),
        warn: sinon.stub(),
      };

      await installServiceDependencies({
        servicePath: '/services',
        readdirSyncFn: sinon.stub().returns(buildServiceEntries()),
        execFn,
        loggerInstance,
        concurrency: 4,
        silentFail: true,
      });

      expect(loggerInstance.warn.calledOnce).to.equal(true);
      expect(execFn.callCount).to.equal(serviceNames.length);
    });

    it('should stop starting new installs and throw when silent fail is disabled', async () => {
      const execFn = sinon.stub().callsFake(async (command) => {
        if (command.includes('service-b')) {
          throw new Error('install failed');
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
      });

      const loggerInstance = {
        info: sinon.stub(),
        warn: sinon.stub(),
      };

      let error;
      try {
        await installServiceDependencies({
          servicePath: '/services',
          readdirSyncFn: sinon.stub().returns(buildServiceEntries()),
          execFn,
          loggerInstance,
          concurrency: 4,
          silentFail: false,
        });
      } catch (e) {
        error = e;
      }

      expect(error).to.be.an('error');
      expect(error.message).to.equal('install failed');
      expect(execFn.callCount).to.be.lessThan(serviceNames.length);
    });

    it('should do nothing when there are no service directories', async () => {
      const execFn = sinon.stub().resolves();

      await installServiceDependencies({
        servicePath: '/services',
        readdirSyncFn: sinon.stub().returns([]),
        execFn,
        loggerInstance: {
          info: sinon.stub(),
          warn: sinon.stub(),
        },
        concurrency: 4,
        silentFail: false,
      });

      expect(execFn.called).to.equal(false);
    });
  });

  describe('runCli', () => {
    it('should exit with code 1 when install fails', async () => {
      const exitStub = sinon.stub(process, 'exit');
      const installFn = sinon.stub().rejects(new Error('install failed'));

      await runCli(installFn);

      expect(exitStub.calledWith(1)).to.equal(true);

      exitStub.restore();
    });

    it('should resolve when install succeeds', async () => {
      const installFn = sinon.stub().resolves();

      await runCli(installFn);

      expect(installFn.calledOnce).to.equal(true);
    });
  });
});
