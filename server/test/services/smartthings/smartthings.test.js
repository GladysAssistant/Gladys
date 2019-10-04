const sinon = require('sinon');

const { assert, fake } = sinon;
const { expect } = require('chai');
const EventEmitter = require('events');
const SmartthingsService = require('../../../services/smartthings');

const gladys = {
  event: new EventEmitter(),
  variable: {
    getValue: fake.resolves('value'),
  },
  oauth: {
    getClient: fake.resolves('st-client'),
  },
};

describe('smartthingsService', () => {
  const smartthingsService = SmartthingsService(gladys, 'be86c4db-489f-466c-aeea-1e262c4ee720');
  beforeEach(() => {
    sinon.reset();
  });
  it('should have controllers', () => {
    expect(smartthingsService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await smartthingsService.start();
    assert.callCount(gladys.variable.getValue, 2);
    assert.callCount(gladys.oauth.getClient, 1);
  });
  it('should stop service', async () => {
    await smartthingsService.stop();
  });
});
