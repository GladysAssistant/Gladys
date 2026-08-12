// eslint-disable-next-line no-restricted-syntax -- deliberate singleton use, see the sandbox comment below
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

// Build a mock of the @duckdb/node-api module where DuckDBInstance.create resolves
// a fake instance/connection. Errors can be injected on connection.disconnectSync
// and instance.closeSync to exercise the backup instance close logic.
const buildMockDuckDbApi = ({ disconnectError, closeError } = {}) => {
  const connection = {
    runAndReadAll: sinon.stub().resolves({ getRowObjectsJS: () => [] }),
    run: sinon.stub().resolves(),
    disconnectSync: sinon.stub(),
  };
  if (disconnectError) {
    connection.disconnectSync.throws(disconnectError);
  }
  const instance = {
    connect: sinon.stub().resolves(connection),
    closeSync: sinon.stub(),
  };
  if (closeError) {
    instance.closeSync.throws(closeError);
  }
  const DuckDBInstance = {
    create: sinon.stub().resolves(instance),
  };
  return {
    api: { DuckDBInstance, DuckDBTimestampValue: class DuckDBTimestampValue {} },
    connection,
    instance,
  };
};

describe('models/index', () => {
  describe('DuckDB memory limits', () => {
    // Use a dedicated sandbox for the process.constrainedMemory stub: calling
    // sinon.restore() on the DEFAULT sandbox would untrack the fakes that other
    // test files create at load time, so their sinon.reset() cleanup would stop
    // clearing call history and every suite running after this file would leak
    // call counts between tests.
    const sandbox = sinon.createSandbox();
    const savedMemoryLimitEnv = process.env.DUCKDB_MEMORY_LIMIT;
    const savedBackupMemoryLimitEnv = process.env.DUCKDB_BACKUP_MEMORY_LIMIT;

    const restoreEnv = (key, value) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    };

    beforeEach(() => {
      delete process.env.DUCKDB_MEMORY_LIMIT;
      delete process.env.DUCKDB_BACKUP_MEMORY_LIMIT;
    });

    afterEach(() => {
      restoreEnv('DUCKDB_MEMORY_LIMIT', savedMemoryLimitEnv);
      restoreEnv('DUCKDB_BACKUP_MEMORY_LIMIT', savedBackupMemoryLimitEnv);
      sandbox.restore();
    });

    const loadDbWithMemory = ({ totalMemBytes, constrainedMemBytes }) => {
      const { api } = buildMockDuckDbApi();
      sandbox.stub(process, 'constrainedMemory').returns(constrainedMemBytes);
      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
        error: sinon.stub(),
      };
      const db = proxyquire('../../models', {
        '@duckdb/node-api': api,
        '../utils/logger': mockLogger,
        os: { totalmem: () => totalMemBytes },
      });
      return { api, db, mockLogger };
    };

    const findBackupCreateCall = (api) =>
      api.DuckDBInstance.create.getCalls().find((call) => call.args[1] && call.args[1].access_mode === 'READ_ONLY');

    it('should use the cgroup memory limit when it is lower than the host total memory', async () => {
      // Host with 16GB of RAM, container limited to 6GB by cgroup:
      // the default must be 30% of 6GB, not 30% of 16GB.
      const { api, db } = loadDbWithMemory({
        totalMemBytes: 16 * 1024 * 1024 * 1024,
        constrainedMemBytes: 6 * 1024 * 1024 * 1024,
      });
      await db.duckDbReadConnectionAllAsync('SELECT 1');
      // Same formula as models/index.js: floor(30% of 6GB) in MB = 1843MB.
      const expectedMB = Math.floor(Math.floor(6 * 1024 * 1024 * 1024 * 0.3) / (1024 * 1024));
      expect(api.DuckDBInstance.create.firstCall.args[1]).to.deep.equal({ memory_limit: `${expectedMB}MB` });
    });

    it('should ignore the cgroup value when no limit is set and cap the default at 4GB', async () => {
      // No cgroup limit (constrainedMemory returns 0), 64GB host: 30% would be
      // ~19GB, the default must be capped at 4GB, and the backup default at 1GB.
      const { api, db } = loadDbWithMemory({
        totalMemBytes: 64 * 1024 * 1024 * 1024,
        constrainedMemBytes: 0,
      });
      await db.duckDbReadConnectionAllAsync('SELECT 1');
      expect(api.DuckDBInstance.create.firstCall.args[1]).to.deep.equal({ memory_limit: '4096MB' });
      await db.duckDbCreateBackupInstance();
      expect(findBackupCreateCall(api).args[1].memory_limit).to.equal('1024MB');
    });

    it('should ignore a cgroup "no limit" sentinel larger than the host total memory', async () => {
      // cgroup v2 "max" surfaces as a huge sentinel (e.g. 2^44 bytes): the
      // default must stay based on the host total, capped at 4GB.
      const { api, db } = loadDbWithMemory({
        totalMemBytes: 16 * 1024 * 1024 * 1024,
        constrainedMemBytes: 2 ** 44,
      });
      await db.duckDbReadConnectionAllAsync('SELECT 1');
      // 30% of 16GB is ~4915MB, capped at 4096MB.
      expect(api.DuckDBInstance.create.firstCall.args[1]).to.deep.equal({ memory_limit: '4096MB' });
    });

    it('should cap the default backup limit at 1GB when DUCKDB_MEMORY_LIMIT is above 1GB', async () => {
      // Documented formula: min(1GB, effective main limit) — even when the
      // computed default on this machine would be smaller than 1GB.
      process.env.DUCKDB_MEMORY_LIMIT = '2GB';
      const { api, db } = loadDbWithMemory({
        totalMemBytes: 2 * 1024 * 1024 * 1024,
        constrainedMemBytes: 0,
      });
      await db.duckDbCreateBackupInstance();
      expect(findBackupCreateCall(api).args[1].memory_limit).to.equal('1024MB');
    });

    it('should warn when DUCKDB_MEMORY_LIMIT exceeds the detected available memory', async () => {
      process.env.DUCKDB_MEMORY_LIMIT = '8GB';
      const { mockLogger } = loadDbWithMemory({
        totalMemBytes: 4 * 1024 * 1024 * 1024,
        constrainedMemBytes: 0,
      });
      expect(mockLogger.warn.calledWithMatch(/DUCKDB_MEMORY_LIMIT \(8GB\) exceeds the memory available/)).to.equal(
        true,
      );
    });

    it('should not let the default backup limit exceed a custom DUCKDB_MEMORY_LIMIT', async () => {
      // Custom main limit below 1GB and no backup override: the backup default
      // must be clamped to the effective main limit, not to min(1GB, computed default).
      process.env.DUCKDB_MEMORY_LIMIT = '512MB';
      const { api, db } = loadDbWithMemory({
        totalMemBytes: 16 * 1024 * 1024 * 1024,
        constrainedMemBytes: 0,
      });
      await db.duckDbCreateBackupInstance();
      expect(api.DuckDBInstance.create.firstCall.args[1]).to.deep.equal({ memory_limit: '512MB' });
      const backupCreateCall = api.DuckDBInstance.create
        .getCalls()
        .find((call) => call.args[1] && call.args[1].access_mode === 'READ_ONLY');
      expect(backupCreateCall.args[1].memory_limit).to.equal('512MB');
    });

    it('should reuse a sub-MB DUCKDB_MEMORY_LIMIT verbatim for the backup limit', async () => {
      // Degenerate but explicit sub-MB main limit: the backup default must not
      // exceed it, so the main limit string is reused as-is.
      process.env.DUCKDB_MEMORY_LIMIT = '512KB';
      const { api, db } = loadDbWithMemory({
        totalMemBytes: 16 * 1024 * 1024 * 1024,
        constrainedMemBytes: 0,
      });
      await db.duckDbCreateBackupInstance();
      const backupCreateCall = api.DuckDBInstance.create
        .getCalls()
        .find((call) => call.args[1] && call.args[1].access_mode === 'READ_ONLY');
      expect(backupCreateCall.args[1].memory_limit).to.equal('512KB');
    });

    it('should fall back on the computed default for the backup limit when DUCKDB_MEMORY_LIMIT is not parseable', async () => {
      // Unparseable custom limit: it is still passed through to DuckDB verbatim,
      // and the backup default falls back on min(1GB, computed default).
      process.env.DUCKDB_MEMORY_LIMIT = '25% of RAM';
      const { api, db } = loadDbWithMemory({
        totalMemBytes: 16 * 1024 * 1024 * 1024,
        constrainedMemBytes: 0,
      });
      await db.duckDbCreateBackupInstance();
      expect(api.DuckDBInstance.create.firstCall.args[1]).to.deep.equal({ memory_limit: '25% of RAM' });
      const backupCreateCall = api.DuckDBInstance.create
        .getCalls()
        .find((call) => call.args[1] && call.args[1].access_mode === 'READ_ONLY');
      expect(backupCreateCall.args[1].memory_limit).to.equal('1024MB');
    });
  });

  describe('duckDbCreateBackupInstance', () => {
    it('should log warning when connection close fails but still close database', async () => {
      const connCloseError = new Error('Connection close failed');
      const { api, connection, instance } = buildMockDuckDbApi({ disconnectError: connCloseError });

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
        error: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        '@duckdb/node-api': api,
        '../utils/logger': mockLogger,
      });

      const backupInstance = await db.duckDbCreateBackupInstance();
      await backupInstance.close();

      expect(mockLogger.warn.calledOnce).to.equal(true);
      expect(mockLogger.warn.firstCall.args[0]).to.include('Error closing backup connection');
      expect(connection.disconnectSync.called).to.equal(true);
      expect(instance.closeSync.calledOnce).to.equal(true);
    });

    it('should reject when database close fails', async () => {
      const dbCloseError = new Error('Database close failed');
      const { api } = buildMockDuckDbApi({ closeError: dbCloseError });

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
        error: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        '@duckdb/node-api': api,
        '../utils/logger': mockLogger,
      });

      const backupInstance = await db.duckDbCreateBackupInstance();

      try {
        await backupInstance.close();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Database close failed');
      }
    });

    it('should resolve when both connection and database close successfully', async () => {
      const { api, connection, instance } = buildMockDuckDbApi();

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
        error: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        '@duckdb/node-api': api,
        '../utils/logger': mockLogger,
      });

      const backupInstance = await db.duckDbCreateBackupInstance();

      // allAsync runs the query on the backup connection and returns plain JS rows.
      const rows = await backupInstance.allAsync("EXPORT DATABASE '/tmp/backup'");
      expect(rows).to.deep.equal([]);
      expect(connection.runAndReadAll.calledWith("EXPORT DATABASE '/tmp/backup'")).to.equal(true);

      await backupInstance.close();

      expect(connection.disconnectSync.calledOnce).to.equal(true);
      expect(instance.closeSync.calledOnce).to.equal(true);
      expect(mockLogger.warn.called).to.equal(false);
    });

    it('should open the backup instance read-only with the dedicated backup memory limit and few threads', async () => {
      const savedBackupMemoryLimitEnv = process.env.DUCKDB_BACKUP_MEMORY_LIMIT;
      process.env.DUCKDB_BACKUP_MEMORY_LIMIT = '512MB';
      try {
        const { api } = buildMockDuckDbApi();

        const mockLogger = {
          info: sinon.stub(),
          warn: sinon.stub(),
          debug: sinon.stub(),
          error: sinon.stub(),
        };

        const db = proxyquire('../../models', {
          '@duckdb/node-api': api,
          '../utils/logger': mockLogger,
        });

        await db.duckDbCreateBackupInstance();

        const backupCreateCall = api.DuckDBInstance.create
          .getCalls()
          .find((call) => call.args[1] && call.args[1].access_mode === 'READ_ONLY');
        expect(backupCreateCall).to.not.equal(undefined);
        expect(backupCreateCall.args[1]).to.deep.equal({
          memory_limit: '512MB',
          threads: '2',
          access_mode: 'READ_ONLY',
        });
      } finally {
        if (savedBackupMemoryLimitEnv === undefined) {
          delete process.env.DUCKDB_BACKUP_MEMORY_LIMIT;
        } else {
          process.env.DUCKDB_BACKUP_MEMORY_LIMIT = savedBackupMemoryLimitEnv;
        }
      }
    });
  });

  describe('duckDbClose', () => {
    it('should disconnect the connections and close the instance', async () => {
      const { api, connection, instance } = buildMockDuckDbApi();

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
        error: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        '@duckdb/node-api': api,
        '../utils/logger': mockLogger,
      });

      // Force initialization to complete (the eager warmup is asynchronous).
      await db.duckDbReadConnectionAllAsync('SELECT 1');

      // The getters expose the initialized DuckDB objects.
      expect(db.duckDb).to.equal(instance);
      expect(db.duckDbReadConnection).to.equal(connection);
      expect(db.duckDbWriteConnection).to.equal(connection);

      // A write helper runs on the write connection.
      await db.duckDbSetTimezone('UTC');
      expect(connection.runAndReadAll.calledWith('set timezone=?;', ['UTC'])).to.equal(true);

      await db.duckDbClose();

      // Both read and write connections (the same mock connection here) are disconnected.
      expect(connection.disconnectSync.callCount).to.equal(2);
      expect(instance.closeSync.calledOnce).to.equal(true);
    });
  });

  describe('DuckDB initialization', () => {
    it('should log the error and allow a retry when the first initialization fails', async () => {
      const createError = new Error('cannot open database');
      const connection = {
        runAndReadAll: sinon.stub().resolves({ getRowObjectsJS: () => [{ ok: 1 }] }),
        run: sinon.stub().resolves(),
        disconnectSync: sinon.stub(),
      };
      const instance = {
        connect: sinon.stub().resolves(connection),
        closeSync: sinon.stub(),
      };
      const create = sinon.stub();
      create.onFirstCall().rejects(createError); // eager warmup fails
      create.resolves(instance); // later attempts succeed
      const api = {
        DuckDBInstance: { create },
        DuckDBTimestampValue: class DuckDBTimestampValue {},
      };

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
        error: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        '@duckdb/node-api': api,
        '../utils/logger': mockLogger,
      });

      // Let the eager warmup reject and be caught/logged.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      expect(mockLogger.error.calledWithMatch(/DuckDB initialization failed/)).to.equal(true);

      // A later query re-runs initialization (the cached rejected promise was cleared) and succeeds.
      const rows = await db.duckDbReadConnectionAllAsync('SELECT 1');
      expect(rows).to.deep.equal([{ ok: 1 }]);
      expect(create.calledTwice).to.equal(true);
    });
  });
});
