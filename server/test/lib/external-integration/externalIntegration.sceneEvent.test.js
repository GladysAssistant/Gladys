const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert } = sinon;

const { BadParameters, NotFoundError, TooManyRequests } = require('../../../utils/coreErrors');
const { EVENTS } = require('../../../utils/constants');
const { MAX_SCENE_EVENTS_PER_MINUTE } = require('../../../lib/external-integration/constants');
const { coerceSceneValue } = require('../../../lib/external-integration/externalIntegration.sceneDeclarations');
const { buildSupervisor, seedExternalService, TEST_MANIFEST, TEST_SCENE_MANIFEST } = require('./testUtils.test');

const seedSceneService = (overrides = {}) => seedExternalService({ manifest: TEST_SCENE_MANIFEST, ...overrides });

describe('externalIntegration.publishSceneEvent', () => {
  let externalIntegration;
  let event;
  let service;

  beforeEach(async () => {
    service = await seedSceneService();
    ({ externalIntegration, event } = buildSupervisor());
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should emit the event with the two whitelists built from the declaration', () => {
    const emitted = externalIntegration.publishSceneEvent(service, {
      key: 'object_detected',
      data: {
        camera: 'ext:frigate:front',
        label: 'person',
        zone: 'driveway',
        score: 0.92,
        moving: true,
        // undeclared everywhere: dropped from both objects
        junk: 'x',
      },
    });
    const expected = {
      type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
      integration: service.selector,
      trigger_key: 'object_detected',
      // the declared fields minus the section, `min_score` absent -> null
      filters: { camera: 'ext:frigate:front', label: 'person', zone: 'driveway', min_score: null },
      // the declared variables only: `camera` is a filter, not a variable
      data: { label: 'person', zone: 'driveway', score: 0.92, moving: true },
    };
    expect(emitted).to.deep.equal(expected);
    sinonAssert.calledOnceWithExactly(event.emit, EVENTS.TRIGGERS.CHECK, expected);
  });

  it('should stamp every declared key null when the payload is empty', () => {
    const emitted = externalIntegration.publishSceneEvent(service, { key: 'object_detected' });
    expect(emitted.filters).to.deep.equal({ camera: null, label: null, zone: null, min_score: null });
    expect(emitted.data).to.deep.equal({ label: null, zone: null, score: null, moving: null });
  });

  it('should emit empty objects for a trigger declaring no field nor variable', () => {
    const emitted = externalIntegration.publishSceneEvent(service, { key: 'doorbell_pressed', data: { any: 1 } });
    expect(emitted.filters).to.deep.equal({});
    expect(emitted.data).to.deep.equal({});
  });

  it('should coerce each side by its own declared type', () => {
    const emitted = externalIntegration.publishSceneEvent(service, {
      key: 'object_detected',
      // a number on a string filter, a numeric string on the number filter
      // and the number variable, a "true" string on the boolean variable
      data: { camera: 12, min_score: '0.5', score: '3', moving: 'true', zone: false },
    });
    expect(emitted.filters).to.deep.equal({ camera: '12', label: null, zone: null, min_score: 0.5 });
    expect(emitted.data).to.deep.equal({ label: null, zone: null, score: 3, moving: true });
  });

  it('should return 404 on an undeclared key and on an integration declaring no trigger', async () => {
    expect(() => externalIntegration.publishSceneEvent(service, { key: 'unknown' })).to.throw(
      NotFoundError,
      'SCENE_TRIGGER_NOT_DECLARED',
    );
    const plainService = await seedExternalService({
      name: 'ext-dev-plain',
      selector: 'ext-dev-plain',
      manifest: TEST_MANIFEST,
    });
    expect(() => externalIntegration.publishSceneEvent(plainService, { key: 'object_detected' })).to.throw(
      NotFoundError,
    );
    sinonAssert.notCalled(event.emit);
  });

  it('should refuse a malformed body or key', () => {
    expect(() => externalIntegration.publishSceneEvent(service, null)).to.throw(BadParameters, 'body');
    expect(() => externalIntegration.publishSceneEvent(service, [])).to.throw(BadParameters, 'body');
    expect(() => externalIntegration.publishSceneEvent(service, {})).to.throw(BadParameters, 'key');
    expect(() => externalIntegration.publishSceneEvent(service, { key: 12 })).to.throw(BadParameters, 'key');
  });

  it('should refuse nested data, arrays, long strings, non-finite numbers and too many keys', () => {
    const invalidPayloads = [
      { data: 'person' },
      { data: ['person'] },
      { data: { label: { nested: true } } },
      { data: { label: ['person', 'car'] } },
      { data: { label: 'x'.repeat(1001) } },
      { data: { score: Infinity } },
      { data: { score: undefined } },
      { data: Object.fromEntries(Array.from({ length: 31 }, (value, index) => [`k${index}`, 1])) },
    ];
    invalidPayloads.forEach((payload) => {
      expect(() => externalIntegration.publishSceneEvent(service, { key: 'object_detected', ...payload })).to.throw(
        BadParameters,
      );
    });
    sinonAssert.notCalled(event.emit);
  });

  it('should rate limit on a counter separate from the states', () => {
    for (let i = 0; i < MAX_SCENE_EVENTS_PER_MINUTE; i += 1) {
      externalIntegration.publishSceneEvent(service, { key: 'doorbell_pressed' });
    }
    expect(() => externalIntegration.publishSceneEvent(service, { key: 'doorbell_pressed' })).to.throw(
      TooManyRequests,
      'RATE_LIMIT_EXCEEDED',
    );
    // the states keep their own budget
    expect(externalIntegration.stateRateLimits.has(service.id)).to.equal(false);
    expect(externalIntegration.sceneEventRateLimits.get(service.id).count).to.equal(MAX_SCENE_EVENTS_PER_MINUTE);
  });

  it('should reset the rate limit window after one minute', () => {
    const clock = sinon.useFakeTimers(new Date('2026-09-18T10:00:00.000Z'));
    for (let i = 0; i < MAX_SCENE_EVENTS_PER_MINUTE; i += 1) {
      externalIntegration.publishSceneEvent(service, { key: 'doorbell_pressed' });
    }
    expect(() => externalIntegration.publishSceneEvent(service, { key: 'doorbell_pressed' })).to.throw(TooManyRequests);
    clock.tick(60 * 1000);
    externalIntegration.publishSceneEvent(service, { key: 'doorbell_pressed' });
    expect(externalIntegration.sceneEventRateLimits.get(service.id).count).to.equal(1);
  });
});

describe('externalIntegration.coerceSceneValue', () => {
  it('should keep values already of the declared type', () => {
    expect(coerceSceneValue('person', 'string')).to.equal('person');
    expect(coerceSceneValue(12.5, 'number')).to.equal(12.5);
    expect(coerceSceneValue(false, 'boolean')).to.equal(false);
  });

  it('should coerce unambiguous values', () => {
    expect(coerceSceneValue(3, 'string')).to.equal('3');
    expect(coerceSceneValue('3', 'number')).to.equal(3);
    expect(coerceSceneValue('true', 'boolean')).to.equal(true);
    expect(coerceSceneValue('false', 'boolean')).to.equal(false);
  });

  it('should drop ambiguous or absent values to null', () => {
    expect(coerceSceneValue(undefined, 'string')).to.equal(null);
    expect(coerceSceneValue(null, 'number')).to.equal(null);
    expect(coerceSceneValue(true, 'string')).to.equal(null);
    expect(coerceSceneValue('abc', 'number')).to.equal(null);
    expect(coerceSceneValue(' ', 'number')).to.equal(null);
    expect(coerceSceneValue(Infinity, 'number')).to.equal(null);
    expect(coerceSceneValue('yes', 'boolean')).to.equal(null);
    expect(coerceSceneValue(1, 'boolean')).to.equal(null);
    expect(coerceSceneValue('x', 'unknown')).to.equal(null);
  });
});
