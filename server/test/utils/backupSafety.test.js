const { expect } = require('chai');

const {
  isSafeBackupName,
  assertSafeBackupName,
  isSafeArchiveEntry,
  escapeSqlStringLiteral,
} = require('../../utils/backupSafety');

describe('utils.backupSafety', () => {
  describe('isSafeBackupName', () => {
    it('should accept the names Gladys produces', () => {
      expect(isSafeBackupName('gladys-db-backup-2024-6-29-13-47-50.tar.gz')).to.equal(true);
      expect(isSafeBackupName('gladys-db-backup_2024-6-29-13-47-50_parquet_folder')).to.equal(true);
      expect(isSafeBackupName('encoded-old-gladys-db-backup.db.gz')).to.equal(true);
    });

    it('should reject every shell and SQL metacharacter', () => {
      const dangerous = [
        'backup$(id).db',
        'backup`id`.db',
        'backup;id.db',
        'backup|id.db',
        'backup&id.db',
        "backup'.db",
        'backup".db',
        'backup name.db',
        'backup\nid.db',
        'backup>out.db',
        'folder/backup.db',
        '..',
        '',
      ];
      dangerous.forEach((name) => {
        expect(isSafeBackupName(name), `${name} should be rejected`).to.equal(false);
      });
    });

    it('should reject a non-string', () => {
      expect(isSafeBackupName(undefined)).to.equal(false);
      expect(isSafeBackupName(null)).to.equal(false);
      expect(isSafeBackupName(42)).to.equal(false);
    });
  });

  describe('assertSafeBackupName', () => {
    it('should return the name when it is safe', () => {
      expect(assertSafeBackupName('gladys-db-backup.tar.gz')).to.equal('gladys-db-backup.tar.gz');
    });

    it('should throw when the name is not safe', () => {
      expect(() => assertSafeBackupName('a$(touch pwned).db')).to.throw('BACKUP_UNSAFE_FILE_NAME');
    });
  });

  describe('isSafeArchiveEntry', () => {
    it('should accept a nested entry of a Parquet folder', () => {
      expect(isSafeArchiveEntry('gladys-db-backup_2024-6-29_parquet_folder/schema.sql')).to.equal(true);
      expect(isSafeArchiveEntry('gladys-db-backup_2024-6-29_parquet_folder/t_device_state.parquet')).to.equal(true);
      // tar lists a folder with a trailing slash
      expect(isSafeArchiveEntry('gladys-db-backup_2024-6-29_parquet_folder/')).to.equal(true);
    });

    it('should reject path traversal and absolute paths', () => {
      expect(isSafeArchiveEntry('/etc/passwd')).to.equal(false);
      expect(isSafeArchiveEntry('../../etc/passwd')).to.equal(false);
      expect(isSafeArchiveEntry('folder/../../etc/passwd')).to.equal(false);
    });

    it('should reject an entry carrying shell or SQL metacharacters', () => {
      expect(isSafeArchiveEntry('x$(touch pwned).db')).to.equal(false);
      expect(isSafeArchiveEntry("folder'; DROP TABLE t_user; --_parquet_folder")).to.equal(false);
      expect(isSafeArchiveEntry('folder/x`id`.parquet')).to.equal(false);
    });

    it('should reject an empty entry', () => {
      expect(isSafeArchiveEntry('')).to.equal(false);
      expect(isSafeArchiveEntry(undefined)).to.equal(false);
    });
  });

  describe('escapeSqlStringLiteral', () => {
    it('should double the single quotes', () => {
      expect(escapeSqlStringLiteral("folder'name")).to.equal("folder''name");
      expect(escapeSqlStringLiteral("a'; ATTACH 'evil.db' AS e; --")).to.equal("a''; ATTACH ''evil.db'' AS e; --");
    });

    it('should leave a normal path untouched', () => {
      expect(escapeSqlStringLiteral('/var/lib/gladys/backups/restore/folder')).to.equal(
        '/var/lib/gladys/backups/restore/folder',
      );
    });
  });
});
