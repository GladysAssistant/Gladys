const os = require('os');
const path = require('path');
const fse = require('fs-extra');
const { expect } = require('chai');

const { isStorageEmpty, createBackup, restoreBackup } = require('../../../../services/matter-bridge/lib/backup');

describe('Matter bridge backup', () => {
  let root;
  let storagePath;

  beforeEach(async () => {
    root = await fse.mkdtemp(path.join(os.tmpdir(), 'gladys-matter-bridge-backup-'));
    storagePath = path.join(root, 'matter-bridge');
  });

  afterEach(async () => {
    await fse.remove(root);
  });

  it('should tell a missing or empty storage from one holding pairings', async () => {
    expect(await isStorageEmpty(storagePath)).to.equal(true);
    await fse.ensureDir(storagePath);
    expect(await isStorageEmpty(storagePath)).to.equal(true);
    await fse.outputFile(path.join(storagePath, 'gladys-matter-bridge', 'fabrics'), '{}');
    expect(await isStorageEmpty(storagePath)).to.equal(false);
  });

  it('should restore a backup into another storage folder', async () => {
    await fse.outputFile(path.join(storagePath, 'gladys-matter-bridge', 'fabrics'), '{"fabric":1}');
    const backup = await createBackup(storagePath);
    expect(backup).to.be.a('string');
    expect(await fse.pathExists(`${storagePath}-backup.tar.gz`)).to.equal(false);

    const restoredPath = path.join(root, 'restored');
    await restoreBackup(restoredPath, backup);
    expect(await fse.readFile(path.join(restoredPath, 'gladys-matter-bridge', 'fabrics'), 'utf8')).to.equal(
      '{"fabric":1}',
    );
    expect(await fse.pathExists(`${restoredPath}-backup.tar.gz`)).to.equal(false);
  });

  it('should leave an empty storage when a backup cannot be restored', async () => {
    let error;
    try {
      await restoreBackup(storagePath, Buffer.from('not an archive').toString('base64'));
    } catch (e) {
      error = e;
    }
    expect(error).to.be.an('error');
    expect(await isStorageEmpty(storagePath)).to.equal(true);
    expect(await fse.pathExists(`${storagePath}-backup.tar.gz`)).to.equal(false);
  });

  it('should report a storage that cannot be backed up', async () => {
    let error;
    try {
      await createBackup(storagePath);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.an('error');
  });
});
