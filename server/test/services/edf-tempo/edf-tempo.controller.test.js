const { expect } = require('chai');
const { fake, useFakeTimers } = require('sinon');
const EdfTempoService = require('../../../services/edf-tempo');
const EdfTempoController = require('../../../services/edf-tempo/controllers/edf-tempo.controller');

const gladys = {
  gateway: {
    getEdfTempo: fake.resolves({
      today: 'blue',
      tomorrow: 'unknown',
    }),
  },
};

describe('EdfTempoController', () => {
  let clock;
  beforeEach(async () => {
    clock = useFakeTimers(1670563437931);
  });
  afterEach(() => {
    clock.restore();
  });
  it('should get edf tempo data', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const edfTempoService = EdfTempoService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    const edfTempoController = EdfTempoController(edfTempoService.getEdfTempoStates);
    await edfTempoController['get /api/v1/service/edf-tempo/state'].controller(req, res);
    expect(res.json.firstCall.lastArg).to.deep.equal({
      today_peak_state: 'blue',
      tomorrow_peak_state: 'not-defined',
      current_hour_peak_state: 'peak-hour',
    });
  });
});
