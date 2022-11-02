const sinon = require('sinon');

const { fake, assert } = sinon;

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
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.init', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init system', async () => {
    await system.init();

    assert.called(system.dockerode.listContainers);

    assert.notCalled(sequelize.close);
    assert.called(event.on);
  });
});
