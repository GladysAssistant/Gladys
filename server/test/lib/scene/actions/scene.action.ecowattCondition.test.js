const { fake, useFakeTimers } = require('sinon');
const { assert } = require('chai');
const EventEmitter = require('events');

const { AbortScene } = require('../../../../utils/coreErrors');
const { ACTIONS } = require('../../../../utils/constants');
const ecowattData = require('../../../services/ecowatt/ecowatt.data');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const event = new EventEmitter();

describe('scene.ecowattCondition', () => {
  let clock;
  const timezone = 'Europe/Paris';
  beforeEach(async () => {
    clock = useFakeTimers(new Date('2022-12-09T11:00:57'));
  });
  afterEach(() => {
    clock.restore();
  });
  it('should check ecowatt network condition and continue scene ', async () => {
    const gateway = {
      getEcowattSignals: fake.resolves(ecowattData),
    };
    const scope = {};
    await executeActions(
      { event, gateway, timezone },
      [
        [
          {
            type: ACTIONS.ECOWATT.CONDITION,
            ecowatt_network_status: 'ok',
          },
        ],
      ],
      scope,
    );
  });
  it('should stop scene', async () => {
    const gateway = {
      getEcowattSignals: fake.resolves(ecowattData),
    };
    const scope = {};
    const promise = executeActions(
      { event, gateway, timezone },
      [
        [
          {
            type: ACTIONS.ECOWATT.CONDITION,
            ecowatt_network_status: 'warning',
          },
        ],
      ],
      scope,
    );
    return assert.isRejected(promise, AbortScene);
  });
  it('should reject, day not found', async () => {
    const gateway = {
      getEcowattSignals: fake.resolves({ signals: [] }),
    };
    const scope = {};
    const promise = executeActions(
      { event, gateway, timezone },
      [
        [
          {
            type: ACTIONS.ECOWATT.CONDITION,
            ecowatt_network_status: 'warning',
          },
        ],
      ],
      scope,
    );
    await assert.isRejected(promise, AbortScene, 'Ecowatt: day not found');
  });
  it('should reject, hour not found', async () => {
    const gateway = {
      getEcowattSignals: fake.resolves({
        signals: [
          {
            GenerationFichier: '2022-12-08T23:00:00+01:00',
            jour: '2022-12-09T12:00:00',
            dvalue: 1,
            message: 'Pas d’alerte.',
            values: [],
          },
        ],
      }),
    };
    const scope = {};
    const promise = executeActions(
      { event, gateway, timezone },
      [
        [
          {
            type: ACTIONS.ECOWATT.CONDITION,
            ecowatt_network_status: 'warning',
          },
        ],
      ],
      scope,
    );
    await assert.isRejected(promise, AbortScene, 'Ecowatt: hour not found');
  });
  it('should not continue scene, ecowatt signals return error', async () => {
    const gateway = {
      getEcowattSignals: fake.rejects(new Error('500 - error')),
    };
    const scope = {};
    const promise = executeActions(
      { event, gateway, timezone },
      [
        [
          {
            type: ACTIONS.ECOWATT.CONDITION,
            ecowatt_network_status: 'warning',
          },
        ],
      ],
      scope,
    );
    await assert.isRejected(promise, AbortScene, '500 - error');
  });
});
