const { fake } = require('sinon');
const { expect, assert } = require('chai');
const EventEmitter = require('events');

const { AbortScene } = require('../../../../utils/coreErrors');
const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const event = new EventEmitter();

const forecastSummary = {
  description: 'Ensoleillé',
  temp_min: 15,
  temp_max: 31,
  rain: 0,
  uv: 8,
  summary: 'Samedi 5 juillet : Ensoleillé, 15°/31°',
};

describe('scene.meteoFranceGetForecast', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  it('should get forecast summary and expose variables in scope', async () => {
    const house = {
      getBySelector: fake.resolves({ selector: 'main-house', latitude: 46.75, longitude: 4.35 }),
    };
    const getSummaryForHouse = fake.resolves(forecastSummary);
    const service = { getService: fake.returns({ forecast: { getSummaryForHouse } }) };
    const scope = {};
    await executeActions(
      { event, house, service },
      [[{ type: ACTIONS.METEO_FRANCE.GET_FORECAST, house: 'main-house', days: 3 }]],
      scope,
    );
    expect(getSummaryForHouse.firstCall.args[1]).to.equal(3);
    expect(scope['0'][0]).to.deep.equal(forecastSummary);
  });
  it('should default to a one-day summary', async () => {
    const house = {
      getBySelector: fake.resolves({ selector: 'main-house', latitude: 46.75, longitude: 4.35 }),
    };
    const getSummaryForHouse = fake.resolves(forecastSummary);
    const service = { getService: fake.returns({ forecast: { getSummaryForHouse } }) };
    const scope = {};
    await executeActions(
      { event, house, service },
      [[{ type: ACTIONS.METEO_FRANCE.GET_FORECAST, house: 'main-house' }]],
      scope,
    );
    expect(getSummaryForHouse.firstCall.args[1]).to.equal(1);
  });
  it('should abort when the meteofrance service is not found', async () => {
    const house = {
      getBySelector: fake.resolves({ selector: 'main-house', latitude: 46.75, longitude: 4.35 }),
    };
    const service = { getService: fake.returns(null) };
    const scope = {};
    const promise = executeActions(
      { event, house, service },
      [[{ type: ACTIONS.METEO_FRANCE.GET_FORECAST, house: 'main-house' }]],
      scope,
    );
    return assert.isRejected(promise, AbortScene);
  });
  it('should abort when the house has no coordinates', async () => {
    const house = {
      getBySelector: fake.resolves({ selector: 'main-house', latitude: null, longitude: null }),
    };
    const service = { getService: fake.returns({ forecast: { getSummaryForHouse: fake.resolves({}) } }) };
    const scope = {};
    const promise = executeActions(
      { event, house, service },
      [[{ type: ACTIONS.METEO_FRANCE.GET_FORECAST, house: 'main-house' }]],
      scope,
    );
    return assert.isRejected(promise, AbortScene);
  });
});
