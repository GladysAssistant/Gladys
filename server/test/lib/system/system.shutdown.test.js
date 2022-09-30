const sinon = require('sinon');

const { fake, assert } = sinon;

const System = require('../../../lib/system');
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

describe('system.shutdown', () => {
  let processExistStub;
  beforeEach(() => {
    processExistStub = sinon.stub(process, 'exit');
  });
  afterEach(() => {
    processExistStub.restore();
  });
  it('should shutdown system', async () => {
    const system = new System(sequelize, event, config, job);
    system.sequelize = {
      close: fake.resolves(null),
    };
    await system.shutdown();
    assert.calledOnce(system.sequelize.close);
    assert.calledOnce(processExistStub);
  });
  it('should shutdown system even if DB was already closed', async () => {
    const system = new System(sequelize, event, config, job);
    system.sequelize = {
      close: fake.rejects(),
    };
    await system.shutdown();
    assert.calledOnce(system.sequelize.close);
    assert.calledOnce(processExistStub);
  });
});
