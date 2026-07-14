const { expect } = require('chai');
const { assert: sinonAssert } = require('sinon');

const { BadParameters, TooManyRequests } = require('../../../utils/coreErrors');
const { EVENTS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.saveStates', () => {
  let externalIntegration;
  let event;
  let service;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, event } = buildSupervisor());
  });

  it('should forward states as device.new-state events', () => {
    const count = externalIntegration.saveStates(service, [
      { device_feature_external_id: `ext:${service.selector}:paris:temperature`, state: 21.5 },
      { device_feature_external_id: `ext:${service.selector}:cam:text`, text: 'hello' },
      {
        device_feature_external_id: `ext:${service.selector}:paris:temperature`,
        state: 19.2,
        created_at: '2026-07-12T10:00:00.000Z',
      },
    ]);
    expect(count).to.equal(3);
    sinonAssert.calledWith(event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `ext:${service.selector}:paris:temperature`,
      state: 21.5,
    });
    sinonAssert.calledWith(event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `ext:${service.selector}:cam:text`,
      text: 'hello',
    });
    sinonAssert.calledWith(event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `ext:${service.selector}:paris:temperature`,
      state: 19.2,
      created_at: '2026-07-12T10:00:00.000Z',
    });
  });

  const expectBadParameters = (states, messagePart) => {
    try {
      externalIntegration.saveStates(service, states);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include(messagePart);
    }
  };

  it('should reject a non-array payload', () => {
    expectBadParameters({}, 'must be an array');
  });

  it('should reject more than 100 states per request', () => {
    const states = Array.from({ length: 101 }, () => ({
      device_feature_external_id: `ext:${service.selector}:x`,
      state: 1,
    }));
    expectBadParameters(states, 'max 100 states per request');
  });

  it('should reject an external_id outside the integration perimeter', () => {
    expectBadParameters(
      [{ device_feature_external_id: 'ext:another-integration:x', state: 1 }],
      `must start with "ext:${service.selector}:"`,
    );
    expectBadParameters([{ device_feature_external_id: 'mqtt:x', state: 1 }], 'device_feature_external_id');
  });

  it('should reject a state without value', () => {
    expectBadParameters([{ device_feature_external_id: `ext:${service.selector}:x` }], 'numeric "state"');
    expectBadParameters([null], 'states[0]: must be an object');
  });

  it('should reject an invalid created_at', () => {
    expectBadParameters(
      [{ device_feature_external_id: `ext:${service.selector}:x`, state: 1, created_at: 'not-a-date' }],
      'ISO 8601',
    );
  });

  it('should rate limit to 300 states per minute per integration', () => {
    const batch = Array.from({ length: 100 }, () => ({
      device_feature_external_id: `ext:${service.selector}:x`,
      state: 1,
    }));
    externalIntegration.saveStates(service, batch);
    externalIntegration.saveStates(service, batch);
    externalIntegration.saveStates(service, batch);
    try {
      externalIntegration.saveStates(service, [batch[0]]);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(TooManyRequests);
    }
    // another integration is not impacted
    const otherService = { id: 'another-id', selector: 'ext-other' };
    const otherStates = [{ device_feature_external_id: 'ext:ext-other:x', state: 1 }];
    expect(externalIntegration.saveStates(otherService, otherStates)).to.equal(1);
  });

  it('should reset the rate limit window after one minute', async () => {
    const batch = Array.from({ length: 100 }, () => ({
      device_feature_external_id: `ext:${service.selector}:x`,
      state: 1,
    }));
    externalIntegration.saveStates(service, batch);
    externalIntegration.saveStates(service, batch);
    externalIntegration.saveStates(service, batch);
    // simulate the window expiration
    externalIntegration.stateRateLimits.get(service.id).resetAt = Date.now() - 1;
    expect(externalIntegration.saveStates(service, batch)).to.equal(100);
  });
});
