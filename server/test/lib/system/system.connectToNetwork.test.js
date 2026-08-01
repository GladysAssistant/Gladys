const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');
const { networks } = require('./DockerApiMock.test');

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

describe('system.connectToNetwork', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    sinon.reset();
  });

  afterEach(() => {
    // restore the shared network mock
    networks[0].connect = fake.resolves(true);
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;

    try {
      await system.connectToNetwork('network', 'container-id', ['gladys']);
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should connect a container to the network with aliases', async () => {
    await system.connectToNetwork('network', 'container-id', ['gladys']);
    const network = system.dockerode.getNetwork('network');
    assert.calledWith(network.connect, {
      Container: 'container-id',
      EndpointConfig: {
        Aliases: ['gladys'],
      },
    });
  });

  it('should ignore an already connected container', async () => {
    const network = system.dockerode.getNetwork('network');
    const alreadyConnectedError = new Error('endpoint already exists');
    // @ts-ignore
    alreadyConnectedError.statusCode = 403;
    network.connect = fake.rejects(alreadyConnectedError);
    await system.connectToNetwork('network', 'container-id');
  });

  it('should throw other errors', async () => {
    const network = system.dockerode.getNetwork('network');
    network.connect = fake.rejects(new Error('BOOM'));
    try {
      await system.connectToNetwork('network', 'container-id');
      assert.fail('should have fail');
    } catch (e) {
      expect(e.message).to.equal('BOOM');
    }
  });
});
