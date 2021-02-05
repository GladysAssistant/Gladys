const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

const RhasspyMock = require('./rhasspy.mock.test');

const RhasspyService = proxyquire('../../../services/rhasspy/index', {
  './lib': RhasspyMock,
});

describe('RhasspyService', () => {
  const rhasspyService = RhasspyService();
  it('should have start function', () => {
    expect(rhasspyService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(rhasspyService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
});

describe('RhasspyService lifycycle', () => {
  const rhasspyService = RhasspyService();
  it('should start service', async () => {
    await rhasspyService.start();
  });
  it('should stop service', async () => {
    await rhasspyService.stop();
  });
});
