const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();
const fs = require('fs');

let fsError = false;
const fsMock = {
  ...fs,
  access: (file, options, callback) => {
    callback(fsError);
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
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
    fsError = false;
  });

  it('should run inside docker', async () => {
    const insideDocker = await system.isDocker();
    expect(insideDocker).to.equal(true);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should not run inside docker', async () => {
    fsError = true;

    const insideDocker = await system.isDocker();
    expect(insideDocker).to.equal(false);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });
});
