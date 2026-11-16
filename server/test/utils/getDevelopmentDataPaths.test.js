const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { getDevelopmentDataPaths } = require('../../utils/getDevelopmentDataPaths');

const CURRENT_PATHS = { storage: './gladys-data/gladys-development.db', backupsFolder: './gladys-data/backups' };
const LEGACY_PATHS = { storage: './gladys-development.db', backupsFolder: './gladys-backups' };

describe('getDevelopmentDataPaths', () => {
  let root;

  const listFiles = () => fs.readdirSync(root, { recursive: true }).sort();

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gladys-development-data-paths-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('should use the data folder on a fresh checkout, without creating anything', () => {
    expect(getDevelopmentDataPaths(root)).to.deep.equal(CURRENT_PATHS);
    expect(listFiles()).to.deep.equal([]);
  });

  it('should keep using a database that is still at the root, without moving it', () => {
    fs.writeFileSync(path.join(root, 'gladys-development.db'), 'legacy');
    expect(getDevelopmentDataPaths(root)).to.deep.equal(LEGACY_PATHS);
    expect(listFiles()).to.deep.equal(['gladys-development.db']);
    expect(fs.readFileSync(path.join(root, 'gladys-development.db'), 'utf8')).to.equal('legacy');
  });

  it('should use the data folder once the database is there', () => {
    fs.mkdirSync(path.join(root, 'gladys-data'));
    fs.writeFileSync(path.join(root, 'gladys-data', 'gladys-development.db'), 'current');
    expect(getDevelopmentDataPaths(root)).to.deep.equal(CURRENT_PATHS);
  });

  it('should prefer the data folder when both databases exist, and leave the other one alone', () => {
    // An older branch recreates a database at the root when it runs after the move
    fs.mkdirSync(path.join(root, 'gladys-data'));
    fs.writeFileSync(path.join(root, 'gladys-data', 'gladys-development.db'), 'current');
    fs.writeFileSync(path.join(root, 'gladys-development.db'), 'legacy');
    expect(getDevelopmentDataPaths(root)).to.deep.equal(CURRENT_PATHS);
    expect(fs.readFileSync(path.join(root, 'gladys-development.db'), 'utf8')).to.equal('legacy');
  });

  it('should default to the working directory', () => {
    const paths = getDevelopmentDataPaths();
    expect([CURRENT_PATHS, LEGACY_PATHS]).to.deep.include(paths);
  });
});
