const { expect } = require('chai');
const nock = require('nock');
const { fake, useFakeTimers } = require('sinon');
const EdfTempoService = require('../../../services/edf-tempo');

const gladys = {
  gateway: {
    getEdfTempo: fake.resolves({
      today: 'blue',
      tomorrow: 'unknown',
    }),
  },
};

describe('EdfTempoService', () => {
  let clock;
  beforeEach(async () => {
    nock.cleanAll();
    clock = useFakeTimers(1670563437931);
  });
  afterEach(() => {
    clock.restore();
    nock.cleanAll();
  });
  it('should start service', async () => {
    const edfTempoService = EdfTempoService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await edfTempoService.start();
  });
  it('should stop service', async () => {
    const edfTempoService = EdfTempoService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await edfTempoService.stop();
  });
  it('should get data', async () => {
    const edfTempoService = EdfTempoService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    const data = await edfTempoService.getEdfTempoStates();
    expect(data).to.deep.equal({
      today_peak_state: 'blue',
      tomorrow_peak_state: 'not-defined',
      current_hour_peak_state: 'peak-hour',
    });
  });
});
