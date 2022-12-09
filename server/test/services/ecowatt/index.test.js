const { expect } = require('chai');
const { fake, useFakeTimers } = require('sinon');
const EcowattService = require('../../../services/ecowatt');

const ecowattData = require('./ecowatt.data');

const gladys = {
  gateway: {
    getEcowattSignals: fake.resolves(ecowattData),
  },
};

describe('EcowattService', () => {
  let clock;
  beforeEach(async () => {
    clock = useFakeTimers(1670563437931);
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
    expect(data).to.have.property('today');
    expect(data).to.have.property('tomorrow');
    expect(data).to.have.property('days');
  });
});
