const { expect } = require('chai');
const nock = require('nock');
const { useFakeTimers } = require('sinon');
const EdfTempoService = require('../../../services/edf-tempo');

const gladys = {};

describe('EcowattService', () => {
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
    nock('https://particulier.edf.fr')
      .get('/services/rest/referentiel/searchTempoStore?dateRelevant=2022-12-09')
      .reply(200, { couleurJourJ: 'TEMPO_BLEU', couleurJourJ1: 'NON_DEFINI' });
    const edfTempoService = EdfTempoService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    const data = await edfTempoService.getEdfTempoStates();
    expect(data).to.deep.equal({
      today_peak_state: 'blue',
      tomorrow_peak_state: 'not-defined',
      current_hour_peak_state: 'peak-hour',
    });
  });
});
