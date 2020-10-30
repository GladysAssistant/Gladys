const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
};

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.init', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init system', async () => {
    await system.init();

    assert.calledOnce(system.dockerode.listContainers);

    assert.notCalled(sequelize.close);
    assert.calledOnce(event.on);
  });
});
