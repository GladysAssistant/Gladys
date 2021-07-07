const nock = require('nock');
const { fake, stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const chai = require('chai');

const RhasspyManager = proxyquire('../../../../../services/rhasspy/lib/index', {
  '../docker/gladys-rhasspy-container.json': {
    Image: 'rhasspy/rhasspy',
  },
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('rhasspyManager install rhasspy container', () => {
  it('Should install and run container', async () => {
    const rhasspyManager = new RhasspyManager(gladys, 'bdba9c11-9541-40a9-9c1d-82cd9402bcc3');
    gladys.system = {
      getContainers: stub(),
      pull: fake.resolves(),
      createContainer: fake.resolves({
        name: '/gladys-rhasspy',
        image: 'rhasspy/rhasspy',
        state: 'created',
        id: 'deizjf4343',
        networkMode: 'host',
        created_at: 1612280955,
      }),
      restartContainer: fake.resolves(),
    };
    gladys.system.getContainers.onFirstCall().resolves([]);
    gladys.system.getContainers.onSecondCall().resolves([{}]);

    nock('http://0.0.0.0:12101')
      .persist()
      .post('/api/profile?layers=profile')
      .reply(201, {});

    nock('http://0.0.0.0:12101')
      .persist()
      .post('/api/restart')
      .reply(201, {});

    await rhasspyManager.installRhasspyContainer();
    sinon.assert.called(gladys.system.getContainers);
    sinon.assert.called(gladys.system.pull);
    sinon.assert.called(gladys.system.createContainer);
    sinon.assert.called(gladys.system.restartContainer);
    sinon.assert.called(gladys.event.emit);
  }).timeout(50000);

  it('Should failed to start container', async () => {
    const rhasspyManager = new RhasspyManager(gladys, 'bdba9c11-9541-40a9-9c1d-82cd9402bcc3');
    gladys.system = {
      getContainers: fake.resolves([{ state: 'stopped' }]),
      restartContainer: stub().throws(new Error('Failed to restart container')),
    };
    const promise = rhasspyManager.installRhasspyContainer();
    return chai.assert.isRejected(promise, 'Failed to restart container');
  }).timeout(50000);

  it('Should failed on create container', async () => {
    const rhasspyManager = new RhasspyManager(gladys, 'bdba9c11-9541-40a9-9c1d-82cd9402bcc3');
    gladys.system = {
      getContainers: fake.resolves([]),
      pull: fake.resolves(null),
      createContainer: stub().throws(new Error('Failed to create container')),
    };
    const promise = rhasspyManager.installRhasspyContainer();
    return chai.assert.isRejected(promise, 'Failed to create container');
  }).timeout(50000);
});
