const sinon = require('sinon');

const { assert, fake } = sinon;

const EcovacsManager = require('../../../../../services/ecovacs/lib');

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

describe('ecovacs.start command', () => {
  let ecovacsManager;

  beforeEach(() => {
    ecovacsManager = new EcovacsManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Init default values at start', async () => {
    await ecovacsManager.start();
    // TODO : complete
    assert.notCalled(gladys.variable.setValue);
  });

});
