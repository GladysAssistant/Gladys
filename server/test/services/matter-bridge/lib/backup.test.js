const os = require('os');
const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { isStorageEmpty, createBackup, restoreBackup } = require('../../../../services/matter-bridge/lib/backup');

// The fs-extra of the service, the one the backup uses.
// eslint-disable-next-line import/no-dynamic-require
const fse = require(require.resolve('fs-extra', {
  paths: [path.join(__dirname, '../../../../services/matter-bridge')],
}));

describe('Matter bridge backup', () => {
  let root;
  let storagePath;

  beforeEach(async () => {
    root = await fse.mkdtemp(path.join(os.tmpdir(), 'gladys-matter-bridge-backup-'));
    storagePath = path.join(root, 'matter-bridge');
  });

  afterEach(async () => {
    sinon.restore();
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

  it('should back up a storage matter.js is writing to', async () => {
    const node = path.join(storagePath, 'gladys-matter-bridge');
    await fse.outputFile(path.join(node, 'fabrics'), '{"fabric":1}');
    await fse.outputFile(path.join(node, 'fabrics.tmp'), '{"fab');
    await fse.outputFile(path.join(node, 'matter.lock'), '');
    await fse.outputFile(path.join(node, 'matter.pid'), '42');
    await fse.outputFile(path.join(node, 'removed'), 'x');
    const { copyFile } = fse;
    // Like a value matter.js deletes while the folder is copied.
    sinon.stub(fse, 'copyFile').callsFake(async (from, to) => {
      if (from.endsWith('removed')) {
        throw Object.assign(new Error('gone'), { code: 'ENOENT' });
      }
      return copyFile(from, to);
    });
    const backup = await createBackup(storagePath);
    sinon.restore();
    const restoredPath = path.join(root, 'restored');
    await restoreBackup(restoredPath, backup);
    expect((await fse.readdir(path.join(restoredPath, 'gladys-matter-bridge'))).sort()).to.deep.equal(['fabrics']);
    expect(await fse.pathExists(`${storagePath}-snapshot`)).to.equal(false);
  });

  it('should report a file that cannot be copied', async () => {
    await fse.outputFile(path.join(storagePath, 'fabrics'), '{}');
    sinon.stub(fse, 'copyFile').rejects(Object.assign(new Error('denied'), { code: 'EACCES' }));
    let error;
    try {
      await createBackup(storagePath);
    } catch (e) {
      error = e;
    }
    expect(error.code).to.equal('EACCES');
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
