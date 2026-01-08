const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');

const { fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const fsMock = {
  ...fs,
  promises: {
    access: fake.resolves(null),
  },
};

const { isDocker } = proxyquire('../../../lib/system/system.isDocker', {
  fs: fsMock,
});
const System = proxyquire('../../../lib/system', {
  './system.isDocker': { isDocker },
});

const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.isDocker', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    system.dockerode = null;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should run inside docker', async () => {
    fsMock.promises.access = fake.resolves(null);
    system.dockerode = {
      listContainers: fake.resolves(null),
    };
    const insideDocker = await system.isDocker();
    expect(insideDocker).to.equal(true);
  });

  it('should not run inside docker', async () => {
    fsMock.promises.access = fake.rejects(new Error('Not found'));
    const insideDocker = await system.isDocker();
    expect(insideDocker).to.equal(false);
  });

  it('should not run inside docker (dockerode not available)', async () => {
    fsMock.promises.access = fake.resolves(null);
    system.dockerode = null;
    const insideDocker = await system.isDocker();
    expect(insideDocker).to.equal(false);
  });
});
