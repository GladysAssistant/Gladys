const { fake } = require('sinon');
const { expect, assert } = require('chai');
const EventEmitter = require('events');

const { AbortScene } = require('../../../../utils/coreErrors');
const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const event = new EventEmitter();

describe('scene.meteoFranceGetVigilance', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  it('should get vigilance and expose variables in scope', async () => {
    const house = {
      getBySelector: fake.resolves({ selector: 'main-house', latitude: 46.75, longitude: 4.35 }),
    };
    const meteoFranceService = {
      vigilance: {
        getForHouse: fake.resolves({
          dept: '71',
          color: 3,
          alerts: [
            { dept: '71', color: 3, phenomene_id: 3, phenomene_nom: 'Orages' },
            { dept: '71', color: 2, phenomene_id: 6, phenomene_nom: 'Canicule' },
          ],
          text: 'Orages violents attendus en soirée.',
        }),
      },
    };
    const service = { getService: fake.returns(meteoFranceService) };
    const scope = {};
    await executeActions(
      { event, house, service },
      [[{ type: ACTIONS.METEO_FRANCE.GET_VIGILANCE, house: 'main-house' }]],
      scope,
    );
    expect(scope['0'][0]).to.deep.equal({
      dept: '71',
      color: 3,
      color_name: 'Orange',
      phenomena: 'Orages, Canicule',
      text: 'Orages violents attendus en soirée.',
    });
  });
  it('should abort when the meteo service is not found', async () => {
    const house = {
      getBySelector: fake.resolves({ selector: 'main-house', latitude: 46.75, longitude: 4.35 }),
    };
    const service = { getService: fake.returns(null) };
    const scope = {};
    const promise = executeActions(
      { event, house, service },
      [[{ type: ACTIONS.METEO_FRANCE.GET_VIGILANCE, house: 'main-house' }]],
      scope,
    );
    return assert.isRejected(promise, AbortScene);
  });
  it('should abort when the house has no coordinates', async () => {
    const house = {
      getBySelector: fake.resolves({ selector: 'main-house', latitude: null, longitude: null }),
    };
    const service = { getService: fake.returns({ vigilance: { getForHouse: fake.resolves({}) } }) };
    const scope = {};
    const promise = executeActions(
      { event, house, service },
      [[{ type: ACTIONS.METEO_FRANCE.GET_VIGILANCE, house: 'main-house' }]],
      scope,
    );
    return assert.isRejected(promise, AbortScene);
  });
});
