const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

describe('models/index', () => {
  describe('duckDbCreateBackupInstance', () => {
    it('should log warning when connection close fails but still close database', async () => {
      const connCloseError = new Error('Connection close failed');
      const mockConnection = {
        all: sinon.stub().callsFake((query, ...args) => {
          const callback = args[args.length - 1];
          if (typeof callback === 'function') {
            callback(null, []);
          }
        }),
        close: sinon.stub().callsFake((callback) => {
          callback(connCloseError);
        }),
      };
      const mockDatabase = {
        connect: sinon.stub().returns(mockConnection),
        close: sinon.stub().callsFake((callback) => {
          callback(null);
        }),
      };
      const mockDuckDb = {
        Database: sinon.stub().returns(mockDatabase),
      };

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        duckdb: mockDuckDb,
        '../utils/logger': mockLogger,
      });

      const backupInstance = db.duckDbCreateBackupInstance();
      await backupInstance.close();

      expect(mockLogger.warn.calledOnce).to.equal(true);
      expect(mockLogger.warn.firstCall.args[0]).to.include('Error closing backup connection');
      expect(mockDatabase.close.calledOnce).to.equal(true);
    });

    it('should reject when database close fails', async () => {
      const dbCloseError = new Error('Database close failed');
      const mockConnection = {
        all: sinon.stub().callsFake((query, ...args) => {
          const callback = args[args.length - 1];
          if (typeof callback === 'function') {
            callback(null, []);
          }
        }),
        close: sinon.stub().callsFake((callback) => {
          callback(null);
        }),
      };
      const mockDatabase = {
        connect: sinon.stub().returns(mockConnection),
        close: sinon.stub().callsFake((callback) => {
          callback(dbCloseError);
        }),
      };
      const mockDuckDb = {
        Database: sinon.stub().returns(mockDatabase),
      };

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        duckdb: mockDuckDb,
        '../utils/logger': mockLogger,
      });

      const backupInstance = db.duckDbCreateBackupInstance();

      try {
        await backupInstance.close();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Database close failed');
      }
    });

    it('should resolve when both connection and database close successfully', async () => {
      const mockConnection = {
        all: sinon.stub().callsFake((query, ...args) => {
          const callback = args[args.length - 1];
          if (typeof callback === 'function') {
            callback(null, []);
          }
        }),
        close: sinon.stub().callsFake((callback) => {
          callback(null);
        }),
      };
      const mockDatabase = {
        connect: sinon.stub().returns(mockConnection),
        close: sinon.stub().callsFake((callback) => {
          callback(null);
        }),
      };
      const mockDuckDb = {
        Database: sinon.stub().returns(mockDatabase),
      };

      const mockLogger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        debug: sinon.stub(),
      };

      const db = proxyquire('../../models', {
        duckdb: mockDuckDb,
        '../utils/logger': mockLogger,
      });

      const backupInstance = db.duckDbCreateBackupInstance();
      await backupInstance.close();

      expect(mockConnection.close.calledOnce).to.equal(true);
      expect(mockDatabase.close.calledOnce).to.equal(true);
      expect(mockLogger.warn.called).to.equal(false);
    });
  });
});
