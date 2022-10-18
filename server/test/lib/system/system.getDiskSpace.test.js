const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const { exec } = require('../../../utils/childProcess');

let execError = false;
const execMock = async (cmd) => {
  if (execError) {
    throw new Error();
  } else {
    return exec(cmd);
  }
};

const { getDiskSpace } = proxyquire('../../../lib/system/system.getDiskSpace', {
  '../../utils/childProcess': { exec: execMock },
});
const System = proxyquire('../../../lib/system', {
  './system.getDiskSpace': { getDiskSpace },
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

describe('system.getDiskSpace', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    execError = false;
    sinon.reset();
  });

  it('should return disk space', async () => {
    const diskSpace = await system.getDiskSpace();
    expect(diskSpace).to.have.property('filesystem');
    expect(diskSpace).to.have.property('size');
    expect(diskSpace).to.have.property('used');
    expect(diskSpace).to.have.property('available');
    expect(diskSpace).to.have.property('capacity');
    expect(diskSpace).to.have.property('mountpoint');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should fail returning disk space', async () => {
    execError = true;

    const diskSpace = await system.getDiskSpace();
    expect(diskSpace).to.eq(null);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });
});
