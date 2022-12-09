const { expect } = require('chai');
const { fake, useFakeTimers } = require('sinon');
const EcowattService = require('../../../services/ecowatt');

const ecowattData = require('./ecowatt.data');
const ecowattExpectedData = require('./ecowatt.expected');

const gladys = {
  gateway: {
    getEcowattSignals: fake.resolves(ecowattData),
  },
  variable: {
    getValue: fake.resolves('Europe/Paris'),
  },
};

describe('EcowattService', () => {
  let clock;
  beforeEach(async () => {
    clock = useFakeTimers(new Date('2022-12-09T05:23:57.931Z'));
  });
  afterEach(() => {
    clock.restore();
  });
  it('should start service', async () => {
    const ecowattService = EcowattService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await ecowattService.start();
  });
  it('should stop service', async () => {
    const ecowattService = EcowattService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await ecowattService.stop();
  });
  it('should getSignals', async () => {
    const ecowattService = EcowattService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    const data = await ecowattService.getSignals();
    expect(data).to.deep.equal(ecowattExpectedData);
  });
});
