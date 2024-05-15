const { fake, useFakeTimers } = require('sinon');
const { assert } = require('chai');
const EventEmitter = require('events');

const { AbortScene } = require('../../../../utils/coreErrors');
const { ACTIONS } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const event = new EventEmitter();

describe('scene.edfTempoCondition', () => {
  let clock;
  const timezone = 'Europe/Paris';
  beforeEach(async () => {
    clock = useFakeTimers(new Date('2022-12-09T11:00:57'));
  });
  afterEach(() => {
    clock.restore();
  });
  it('should check edf tempo condition for today and continue scene ', async () => {
    const service = {
      getService: fake.returns({
        getEdfTempoStates: fake.resolves({
          today_peak_state: 'white',
          tomorrow_peak_state: 'not-defined',
          current_hour_peak_state: 'off-peak-hour',
        }),
      }),
    };
    const scope = {};
    await executeActions(
      { event, service, timezone },
      [
        [
          {
            type: ACTIONS.EDF_TEMPO.CONDITION,
            edf_tempo_day: 'today',
            edf_tempo_peak_day_type: 'white',
            edf_tempo_peak_hour_type: 'off-peak-hour',
          },
        ],
      ],
      scope,
    );
  });
  it('should check edf tempo condition for tomorrow and continue scene ', async () => {
    const service = {
      getService: fake.returns({
        getEdfTempoStates: fake.resolves({
          today_peak_state: 'white',
          tomorrow_peak_state: 'red',
          current_hour_peak_state: 'off-peak-hour',
        }),
      }),
    };
    const scope = {};
    await executeActions(
      { event, service, timezone },
      [
        [
          {
            type: ACTIONS.EDF_TEMPO.CONDITION,
            edf_tempo_day: 'tomorro',
            edf_tempo_peak_day_type: 'red',
          },
        ],
      ],
      scope,
    );
  });
  it('should check edf tempo condition and stop scene ', async () => {
    const service = {
      getService: fake.returns({
        getEdfTempoStates: fake.resolves({
          today_peak_state: 'blue',
          tomorrow_peak_state: 'not-defined',
          current_hour_peak_state: 'off-peak-hour',
        }),
      }),
    };
    const scope = {};
    const promise = executeActions(
      { event, service, timezone },
      [
        [
          {
            type: ACTIONS.EDF_TEMPO.CONDITION,
            edf_tempo_day: 'today',
            edf_tempo_peak_day_type: 'white',
            edf_tempo_peak_hour_type: 'off-peak-hour',
          },
        ],
      ],
      scope,
    );
    await assert.isRejected(promise, AbortScene, 'EDF_TEMPO_DIFFERENT_STATE');
  });
  it('should check edf tempo condition and stop scene because of API error', async () => {
    const service = {
      getService: fake.returns({
        getEdfTempoStates: fake.rejects(new Error('API_NOT_AVAILABLE')),
      }),
    };
    const scope = {};
    const promise = executeActions(
      { event, service, timezone },
      [
        [
          {
            type: ACTIONS.EDF_TEMPO.CONDITION,
            edf_tempo_day: 'today',
            edf_tempo_peak_day_type: 'white',
            edf_tempo_peak_hour_type: 'off-peak-hour',
          },
        ],
      ],
      scope,
    );
    await assert.isRejected(promise, AbortScene, 'API_NOT_AVAILABLE');
  });
});
