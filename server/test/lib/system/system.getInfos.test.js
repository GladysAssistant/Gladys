const { expect } = require('chai');
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

describe('system.getInfos', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get infos (no release available)', async () => {
    const infos = await system.getInfos();
    expect(infos).to.have.property('hostname');
    expect(infos).to.have.property('type');
    expect(infos).to.have.property('platform');
    expect(infos).to.have.property('arch');
    expect(infos).to.have.property('release');
    expect(infos).to.have.property('uptime');
    expect(infos).to.have.property('loadavg');
    expect(infos).to.have.property('totalmem');
    expect(infos).to.have.property('freemem');
    expect(infos).to.have.property('cpus');
    expect(infos).to.have.property('network_interfaces');
    expect(infos).to.have.property('nodejs_version');
    expect(infos).to.have.property('gladys_version');
    expect(infos).to.have.property('latest_gladys_version', undefined);
    expect(infos).to.have.property('new_release_available', false);
    expect(infos.gladys_version.substr(0, 1)).to.equal('v');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });

  it('should get infos (new release available)', async () => {
    system.gladysVersion = `v1.0.0`;
    system.latestGladysVersion = `v2.0.0`;

    const infos = await system.getInfos();
    expect(infos).to.have.property('hostname');
    expect(infos).to.have.property('type');
    expect(infos).to.have.property('platform');
    expect(infos).to.have.property('arch');
    expect(infos).to.have.property('release');
    expect(infos).to.have.property('uptime');
    expect(infos).to.have.property('loadavg');
    expect(infos).to.have.property('totalmem');
    expect(infos).to.have.property('freemem');
    expect(infos).to.have.property('cpus');
    expect(infos).to.have.property('network_interfaces');
    expect(infos).to.have.property('nodejs_version');
    expect(infos).to.have.property('gladys_version', 'v1.0.0');
    expect(infos).to.have.property('latest_gladys_version', 'v2.0.0');
    expect(infos).to.have.property('new_release_available', true);
    expect(infos.gladys_version.substr(0, 1)).to.equal('v');

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
  });
});
