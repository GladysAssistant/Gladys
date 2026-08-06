const { fake } = require('sinon');
const { expect, assert } = require('chai');
const EventEmitter = require('events');

const { AbortScene } = require('../../../../utils/coreErrors');
const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const event = new EventEmitter();

describe('scene.sendVigilanceMap', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  it('should send the J map without the data: prefix', async () => {
    const message = {
      sendToUser: fake.resolves(null),
    };
    const meteoFranceService = {
      vigilance: {
        getMap: fake.resolves('data:image/png;base64,QUJD'),
      },
    };
    const service = { getService: fake.returns(meteoFranceService) };
    const scope = {};
    await executeActions(
      { event, message, service },
      [[{ type: ACTIONS.METEO_FRANCE.SEND_VIGILANCE_MAP, user: 'pepper', day: 'J', text: 'Vigilance map' }]],
      scope,
    );
    expect(meteoFranceService.vigilance.getMap.firstCall.lastArg).to.equal('J');
    expect(message.sendToUser.firstCall.args).to.deep.equal(['pepper', 'Vigilance map', 'image/png;base64,QUJD']);
  });
  it('should default to the J map and an empty text when not provided', async () => {
    const message = {
      sendToUser: fake.resolves(null),
    };
    const meteoFranceService = {
      vigilance: {
        getMap: fake.resolves('data:image/png;base64,QUJD'),
      },
    };
    const service = { getService: fake.returns(meteoFranceService) };
    const scope = {};
    await executeActions(
      { event, message, service },
      [[{ type: ACTIONS.METEO_FRANCE.SEND_VIGILANCE_MAP, user: 'pepper' }]],
      scope,
    );
    expect(meteoFranceService.vigilance.getMap.firstCall.lastArg).to.equal('J');
    expect(message.sendToUser.firstCall.args).to.deep.equal(['pepper', '', 'image/png;base64,QUJD']);
  });
  it('should send the J1 map when requested', async () => {
    const message = {
      sendToUser: fake.resolves(null),
    };
    const meteoFranceService = {
      vigilance: {
        getMap: fake.resolves('data:image/png;base64,SjE='),
      },
    };
    const service = { getService: fake.returns(meteoFranceService) };
    const scope = {};
    await executeActions(
      { event, message, service },
      [[{ type: ACTIONS.METEO_FRANCE.SEND_VIGILANCE_MAP, user: 'pepper', day: 'J1' }]],
      scope,
    );
    expect(meteoFranceService.vigilance.getMap.firstCall.lastArg).to.equal('J1');
  });
  it('should abort when the meteofrance service is not found', async () => {
    const service = { getService: fake.returns(null) };
    const scope = {};
    const promise = executeActions(
      { event, service },
      [[{ type: ACTIONS.METEO_FRANCE.SEND_VIGILANCE_MAP, user: 'pepper' }]],
      scope,
    );
    return assert.isRejected(promise, AbortScene);
  });
  it('should abort when the map is not available (no API key)', async () => {
    const meteoFranceService = {
      vigilance: {
        getMap: fake.resolves(null),
      },
    };
    const service = { getService: fake.returns(meteoFranceService) };
    const scope = {};
    const promise = executeActions(
      { event, service },
      [[{ type: ACTIONS.METEO_FRANCE.SEND_VIGILANCE_MAP, user: 'pepper' }]],
      scope,
    );
    return assert.isRejected(promise, AbortScene);
  });
});
