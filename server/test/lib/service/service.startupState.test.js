const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Service = require('../../../lib/service');
const StateManager = require('../../../lib/state');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

describe('service.startupState', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should not be starting before the services are started', () => {
    const service = new Service({}, new StateManager(), { emit: fake.returns(null) });
    expect(service.getStartupState()).to.deep.equal({
      in_progress: false,
      total: 0,
      done: 0,
      current: null,
      waiting: [],
    });
  });

  it('should store the startup state and send it to every client', () => {
    const event = { emit: fake.returns(null) };
    const service = new Service({}, new StateManager(), event);
    const startupState = {
      in_progress: true,
      total: 2,
      done: 1,
      current: { name: 'zigbee2mqtt', label: null },
      waiting: [{ name: 'ext-my-integration', label: 'My integration' }],
    };
    service.setStartupState(startupState);
    expect(service.getStartupState()).to.deep.equal(startupState);
    assert.calledOnceWithExactly(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SYSTEM.SERVICES_STARTUP,
      payload: startupState,
    });
  });

  it('should store the startup state without event manager', () => {
    const service = new Service({}, new StateManager());
    const startupState = { in_progress: false, total: 0, done: 0, current: null, waiting: [] };
    service.setStartupState(startupState);
    expect(service.getStartupState()).to.deep.equal(startupState);
  });
});
