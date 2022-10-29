const { fake } = require('sinon');

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

const config = {};

describe('system.vacuum', () => {
  it('should vacuum system', async () => {
    const system = new System(sequelize, event, config, job);
    await system.vacuum();
  });
});
