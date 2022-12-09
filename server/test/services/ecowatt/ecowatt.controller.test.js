const { expect } = require('chai');
const { fake, useFakeTimers } = require('sinon');
const EcowattService = require('../../../services/ecowatt');
const EcowattController = require('../../../services/ecowatt/controllers/ecowatt.controller');
const ecowattData = require('./ecowatt.data');

const gladys = {
  gateway: {
    getEcowattSignals: fake.resolves(ecowattData),
  },
};

describe('EcowattController', () => {
  let clock;
  beforeEach(async () => {
    clock = useFakeTimers(1670563437931);
  });
  afterEach(() => {
    clock.restore();
  });
  it('should getSignals', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const ecowattService = EcowattService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    const ecowattController = EcowattController(ecowattService.getSignals);
    await ecowattController['get /api/v1/service/ecowatt/signals'].controller(req, res);
    expect(res.json.firstCall.lastArg).to.have.property('today');
    expect(res.json.firstCall.lastArg).to.have.property('tomorrow');
    expect(res.json.firstCall.lastArg).to.have.property('days');
  });
});
