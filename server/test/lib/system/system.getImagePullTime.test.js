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

describe('system.getImagePullTime', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return undefined for an image never pulled here', () => {
    expect(system.getImagePullTime('my-image:1.0.0')).to.equal(undefined);
  });

  it('should return when the image was pulled', async () => {
    const before = Date.now();

    await system.pull('my-image:latest');

    const pulledAt = system.getImagePullTime('my-image:latest');
    expect(pulledAt).to.be.a('number');
    expect(pulledAt).to.be.at.least(before);
    expect(pulledAt).to.be.at.most(Date.now());
  });
});
