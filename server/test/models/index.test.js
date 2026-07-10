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
    api: { DuckDBInstance, DuckDBTimestampTZValue: class DuckDBTimestampTZValue {} },
    connection,
    instance,
  };
};

describe('models/index', () => {
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
        DuckDBTimestampTZValue: class DuckDBTimestampTZValue {},
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
