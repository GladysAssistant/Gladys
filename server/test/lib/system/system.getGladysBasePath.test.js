const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.getGladysBasePath', () => {
  let system;
  const sqliteFilePathBeforeSuite = process.env.SQLITE_FILE_PATH;

  beforeEach(async () => {
    delete process.env.SQLITE_FILE_PATH;
    system = new System(sequelize, event, config, job);
    system.getGladysContainerId = fake.resolves('containerid');
    system.getContainerMounts = fake.resolves([]);
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    delete process.env.SQLITE_FILE_PATH;
    sinon.reset();
  });

  after(() => {
    if (sqliteFilePathBeforeSuite === undefined) {
      delete process.env.SQLITE_FILE_PATH;
    } else {
      process.env.SQLITE_FILE_PATH = sqliteFilePathBeforeSuite;
    }
  });
  it('should return default basePath because no mount', async () => {
    const result = await system.getGladysBasePath();
    expect(result).to.deep.equal({
      basePathOnHost: '/var/lib/gladysassistant',
      basePathOnContainer: '/var/lib/gladysassistant',
    });
  });
  it('should return basePath from mount without SQLITE_FILE_PATH env variable', async () => {
    system.getContainerMounts = fake.resolves([
      {
        Source: '/var/lib/dir_on_host',
        Destination: '/var/lib/gladysassistant',
      },
    ]);
    const result = await system.getGladysBasePath();
    expect(result).to.deep.equal({
      basePathOnHost: '/var/lib/dir_on_host',
      basePathOnContainer: '/var/lib/gladysassistant',
    });
  });
  it('should return basePath from mount with SQLITE_FILE_PATH env variable', async () => {
    process.env.SQLITE_FILE_PATH = '/var/lib/dummy_directory/data.db';
    system.getContainerMounts = fake.resolves([
      {
        Source: '/var/lib/dir_on_host',
        Destination: '/var/lib/dummy_directory',
      },
    ]);
    const result = await system.getGladysBasePath();
    expect(result).to.deep.equal({
      basePathOnHost: '/var/lib/dir_on_host',
      basePathOnContainer: '/var/lib/dummy_directory',
    });
  });
});
