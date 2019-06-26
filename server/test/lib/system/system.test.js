const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();

const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});

const sequelize = {
  close: fake.resolves(null),
};

const event = new EventEmitter();

describe('system', () => {
  it('should get infos', async () => {
    const system = new System(sequelize, event);
    await system.init();
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
    expect(infos).to.have.property('latest_gladys_version');
    expect(infos).to.have.property('new_release_available');
    expect(infos.gladys_version.substr(0, 1)).to.equal('v');
  });
  it('should return disk space', async () => {
    const system = new System(sequelize, event);
    const diskSpace = await system.getDiskSpace();
    expect(diskSpace).to.have.property('filesystem');
    expect(diskSpace).to.have.property('size');
    expect(diskSpace).to.have.property('used');
    expect(diskSpace).to.have.property('available');
    expect(diskSpace).to.have.property('capacity');
    expect(diskSpace).to.have.property('mountpoint');
  });
  it('should return if process is running inside docker or not', async () => {
    const system = new System(sequelize, event);
    const isDocker = await system.isDocker();
    expect(typeof isDocker).to.equal('boolean');
  });
  it('should list containers', async () => {
    const system = new System(sequelize, event);
    await system.init();
    const containers = await system.getContainers();
    expect(containers).be.instanceOf(Array);
  });
  it('should init system', async () => {
    const system = new System(sequelize, event);
    await system.init();
  });
  it('should download upgrade', async () => {
    const system = new System(sequelize, event);
    await system.init();
    await system.downloadUpgrade('latest');
  });
  it('should install upgrade', async () => {
    const system = new System(sequelize, event);
    await system.init();
    await system.installUpgrade();
  });
});
