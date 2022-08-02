const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const EventEmitter = require('events');

const event = new EventEmitter();
const EcovacsHandler = require('../../../../../services/ecovacs/lib');

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: {
    get: fake.resolves([]),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('ecovacs.saveConfiguration config command', () => {
  let ecovacsHandler;

  beforeEach(() => {
    ecovacsHandler = new EcovacsHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save configuration of service', () => {
    const result = ecovacsHandler.saveConfiguration();
    assert.notCalled(gladys.variable.setValue);
    expect(result).deep.eq(null);
  });

});
