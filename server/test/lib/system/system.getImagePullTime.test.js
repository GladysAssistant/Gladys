const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

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
  tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
};

describe('system.getImagePullTime', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call (the Dockerode mock fakes live
    // in the mock file's own sandbox, hence the dedicated reset)
    sinon.reset();
    DockerodeMock.resetMockHistory();
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

  it('should stamp the image before the download completes, not after', async () => {
    // the whole point of the stamp: a pull is slow on a Raspberry Pi and the
    // image must be protected from the nightly cleanup for its whole duration.
    // Asserting only after `pull` resolves would pass either way.
    let resolvePull;
    system.dockerode.pull = () =>
      new Promise((resolve) => {
        resolvePull = resolve;
      });

    const pullPromise = system.pull('my-image:latest');

    expect(system.getImagePullTime('my-image:latest')).to.be.a('number');

    resolvePull({});
    await pullPromise;
  });
});
