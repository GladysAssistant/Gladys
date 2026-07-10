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
      await backupInstance.close();

      expect(connection.disconnectSync.calledOnce).to.equal(true);
      expect(instance.closeSync.calledOnce).to.equal(true);
      expect(mockLogger.warn.called).to.equal(false);
    });
  });
});
