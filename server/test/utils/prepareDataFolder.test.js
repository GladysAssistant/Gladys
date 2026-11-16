const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');

const config = require('../../config/config');
const { prepareDataFolder } = require('../../utils/prepareDataFolder');

describe('prepareDataFolder', () => {
  let root;
  let legacyDataFolder;
  let dataFolder;
  let storage;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gladys-prepare-data-folder-'));
    legacyDataFolder = path.join(root, 'server');
    dataFolder = path.join(legacyDataFolder, 'gladys-data');
    storage = path.join(dataFolder, 'gladys-development.db');
    fs.mkdirSync(legacyDataFolder);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('should create the folder of the database', () => {
    const moved = prepareDataFolder({ storage });
    expect(moved).to.deep.equal([]);
    expect(fs.statSync(dataFolder).isDirectory()).to.equal(true);
  });

  it('should leave an existing data folder untouched', () => {
    fs.mkdirSync(dataFolder);
    fs.writeFileSync(storage, 'current');
    const moved = prepareDataFolder({ storage });
    expect(moved).to.deep.equal([]);
    expect(fs.readFileSync(storage, 'utf8')).to.equal('current');
  });

  it('should move nothing when the legacy data folder has no database', () => {
    fs.mkdirSync(path.join(legacyDataFolder, 'matter'));
    const moved = prepareDataFolder({ storage, legacyDataFolder });
    expect(moved).to.deep.equal([]);
    expect(fs.existsSync(path.join(legacyDataFolder, 'matter'))).to.equal(true);
    expect(fs.readdirSync(dataFolder)).to.deep.equal([]);
  });

  it('should move the data found in the legacy data folder', () => {
    fs.writeFileSync(path.join(legacyDataFolder, 'gladys-development.db'), 'sqlite');
    fs.writeFileSync(path.join(legacyDataFolder, 'gladys-development.db-wal'), 'sqlite-wal');
    fs.writeFileSync(path.join(legacyDataFolder, 'gladys-development.duckdb'), 'duckdb');
    fs.mkdirSync(path.join(legacyDataFolder, 'matter', 'matter-controller-data'), { recursive: true });
    fs.writeFileSync(path.join(legacyDataFolder, 'matter', 'matter-controller-data', 'driver.json'), '{}');
    // Source files and other databases stay where they are
    fs.writeFileSync(path.join(legacyDataFolder, 'index.js'), 'source');
    fs.writeFileSync(path.join(legacyDataFolder, 'gladys-test.db'), 'test');

    const moved = prepareDataFolder({ storage, legacyDataFolder });

    expect(moved).to.deep.equal([
      'gladys-development.db',
      'gladys-development.db-wal',
      'gladys-development.duckdb',
      'matter',
    ]);
    expect(fs.readFileSync(storage, 'utf8')).to.equal('sqlite');
    expect(fs.readFileSync(`${storage}-wal`, 'utf8')).to.equal('sqlite-wal');
    expect(fs.readFileSync(path.join(dataFolder, 'gladys-development.duckdb'), 'utf8')).to.equal('duckdb');
    expect(fs.existsSync(path.join(dataFolder, 'matter', 'matter-controller-data', 'driver.json'))).to.equal(true);
    expect(fs.readdirSync(legacyDataFolder).sort()).to.deep.equal(['gladys-data', 'gladys-test.db', 'index.js']);
  });

  it('should not overwrite what the data folder already holds', () => {
    fs.writeFileSync(path.join(legacyDataFolder, 'gladys-development.db'), 'sqlite');
    fs.mkdirSync(path.join(legacyDataFolder, 'matter'));
    fs.mkdirSync(path.join(dataFolder, 'matter'), { recursive: true });
    fs.writeFileSync(path.join(dataFolder, 'matter', 'current'), 'current');

    const moved = prepareDataFolder({ storage, legacyDataFolder });

    expect(moved).to.deep.equal(['gladys-development.db']);
    expect(fs.readdirSync(path.join(dataFolder, 'matter'))).to.deep.equal(['current']);
    expect(fs.existsSync(path.join(legacyDataFolder, 'matter'))).to.equal(true);
  });

  it('should not move the data again once it is in the data folder', () => {
    fs.writeFileSync(path.join(legacyDataFolder, 'gladys-development.db'), 'sqlite');
    expect(prepareDataFolder({ storage, legacyDataFolder })).to.deep.equal(['gladys-development.db']);
    // A database created later in the legacy folder is not the one Gladys uses anymore
    fs.writeFileSync(path.join(legacyDataFolder, 'gladys-development.db'), 'other');
    expect(prepareDataFolder({ storage, legacyDataFolder })).to.deep.equal([]);
    expect(fs.readFileSync(storage, 'utf8')).to.equal('sqlite');
  });

  it('should only migrate a legacy data folder in development', () => {
    // npm test sets SQLITE_FILE_PATH, and a custom database path is never migrated
    expect(config.development.legacyDataFolder).to.equal(null);
    expect(config.test).to.not.have.property('legacyDataFolder');
    expect(config.production).to.not.have.property('legacyDataFolder');
  });
});
