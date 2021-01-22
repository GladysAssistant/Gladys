const { expect } = require('chai');
const sinon = require('sinon');
const assert = require('assert');

const { fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const config = {
  tempFolder: '/tmp/gladys',
};

describe.only('system.shutdown', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config);
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  before(() => {
    sinon.stub(process, 'exit');
  });

  after(() => {
    process.exit.restore();
  });

  it('is stubbed', () => {
    process.exit(1);
    assert(process.exit.isSinonProxy);
    sinon.assert.called(process.exit);
    sinon.assert.calledWith(process.exit, 1);
  });

  it('should failed shutdown', async () => {
    system.sequelize = undefined;

    sinon.stub(process, 'exit');
    process.exit(1);
    await system.shutdown();
    assert.fail('should have fail');
    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
    assert.notCalled(event.emit);
  });

  it('is stubbed and faked', () => {
    process.exit.callsFake(() => {
      return 'foo';
    });
    assert.equal(process.exit(), 'foo');
  });

  it('should shutdown command with success', async () => {
    const result = await system.shutdown();

    expect(result).to.be.eq(true);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);
    assert.notCalled(event.emit);

    assert.calledOnce(system.dockerode.getContainer);
  });
});
