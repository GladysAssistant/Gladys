const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const db = require('../../../models');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, ERROR_MESSAGES } = require('../../../utils/constants');
const { Error400, Error422 } = require('../../../utils/httpErrors');
const { NotFoundError, TooManyRequests, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { WIDGET_GET_TIMEOUT_MS } = require('../../../lib/external-integration/constants');
const { canonicalJson } = require('../../../lib/external-integration/externalIntegration.validateWidgetSettings');
const {
  buildSupervisor,
  seedExternalService,
  TEST_MANIFEST,
  TEST_WIDGET_MANIFEST,
  TEST_PROVIDER_MANIFEST,
} = require('./testUtils.test');

const PREFERENCES = { language: 'fr', units: 'metric' };
const CINEMA_CONTENT = {
  version: 1,
  ttl_seconds: 1800,
  components: [
    { type: 'text', variant: 'caption', text: { en: 'Next 30 days', fr: '30 prochains jours' } },
    { type: 'card-list', display: 'grid', items: [{ title: "L'Odyssée", image: 'poster-1' }] },
    { type: 'button', label: 'Refresh', action: { key: 'refresh', params: { force: true } } },
  ],
};

const seedWidgetService = (overrides = {}) => seedExternalService({ manifest: TEST_WIDGET_MANIFEST, ...overrides });

const seedVacuum = async (service, overrides = {}) => {
  const device = await db.Device.create({
    service_id: service.id,
    name: 'Roborock S7',
    selector: 'roborock-s7',
    external_id: `ext:${service.selector}:s7`,
    ...overrides,
  });
  const battery = await db.DeviceFeature.create({
    device_id: device.id,
    name: 'Battery',
    selector: `${device.selector}-battery`,
    external_id: `${device.external_id}:battery`,
    category: 'battery',
    type: 'integer',
    read_only: true,
    keep_history: true,
    has_feedback: false,
    min: 0,
    max: 100,
  });
  const dock = await db.DeviceFeature.create({
    device_id: device.id,
    name: 'Dock',
    selector: `${device.selector}-dock`,
    external_id: `${device.external_id}:dock`,
    category: 'switch',
    type: 'binary',
    read_only: false,
    keep_history: false,
    has_feedback: false,
    min: 0,
    max: 1,
  });
  return { device, battery: battery.get({ plain: true }), dock: dock.get({ plain: true }) };
};

const resolvingCommand = (content = CINEMA_CONTENT) => fake.resolves({ success: true, data: { content } });

/**
 * @description A sendCommand fake whose promises the test resolves by hand.
 * @returns {object} { fake, resolveAll }.
 * @example
 * const deferred = deferredCommand();
 */
function deferredCommand() {
  const pending = [];
  return {
    fake: fake(
      () =>
        new Promise((resolve, reject) => {
          pending.push({ resolve, reject });
        }),
    ),
    resolve: (index, content = CINEMA_CONTENT) => pending[index].resolve({ success: true, data: { content } }),
    pending,
  };
}

const tick = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

// the widget path awaits a few DB reads before a command goes out
const waitForCalls = async (commandFake, count) => {
  // eslint-disable-next-line no-restricted-syntax
  for (let attempt = 0; attempt < 200 && commandFake.callCount < count; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }
  // let any competing request settle before the caller counts the commands
  await tick();
  await tick();
};

describe('externalIntegration widgets — content path', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getWidgets', () => {
    it('should list the widgets of every installed integration with their status only', async () => {
      const { externalIntegration } = buildSupervisor();
      const widgetService = await seedWidgetService({ status: 'STOPPED' });
      await seedExternalService({
        name: 'ext-dev-tmdb',
        selector: 'ext-dev-tmdb',
        manifest: TEST_PROVIDER_MANIFEST,
        docker_image: TEST_PROVIDER_MANIFEST.docker_image,
      });
      // a device integration without widgets, and an interrupted install
      // without a manifest, list nothing
      await seedExternalService({ name: 'ext-dev-plain', selector: 'ext-dev-plain' });
      await seedExternalService({ name: 'ext-dev-broken', selector: 'ext-dev-broken', manifest: null });
      const widgets = await externalIntegration.getWidgets();
      expect(widgets).to.have.lengthOf(3);
      expect(widgets[0]).to.deep.equal({
        integration_selector: widgetService.selector,
        integration_name: 'Open-Meteo Demo',
        integration_status: 'STOPPED',
        key: 'upcoming_releases',
        label: { en: 'Upcoming releases', fr: 'Prochaines sorties' },
        description: { en: 'Movies coming to theaters in your region.' },
        icon: 'film',
        settings: TEST_WIDGET_MANIFEST.widgets[0].settings,
      });
      expect(widgets[1]).to.include({ key: 'vacuum', integration_selector: widgetService.selector });
      expect(widgets[1].description).to.equal(undefined);
      expect(widgets[2]).to.include({ integration_selector: 'ext-dev-tmdb', integration_name: 'TMDB Demo' });
      widgets.forEach((widget) => {
        expect(widget).to.not.have.any.keys('docker_image', 'version', 'update_available', 'container_id');
      });
    });
  });

  describe('getWidgetContent', () => {
    it('should 404 on an unknown integration or an undeclared widget', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      await expect(
        externalIntegration.getWidgetContent('ext-nope', 'upcoming_releases', {}, PREFERENCES),
      ).to.be.rejectedWith(NotFoundError);
      await expect(externalIntegration.getWidgetContent(service.selector, 'nope', {}, PREFERENCES)).to.be.rejectedWith(
        NotFoundError,
        'EXTERNAL_INTEGRATION_WIDGET_NOT_FOUND',
      );
    });

    it('should relay widget.get with the validated settings, defaults, language and units, then cache', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.sendCommand = resolvingCommand();
      const before = Date.now();
      const response = await externalIntegration.getWidgetContent(
        service.selector,
        'upcoming_releases',
        { region: 'FR' },
        PREFERENCES,
      );
      sinonAssert.calledOnceWithExactly(
        externalIntegration.sendCommand,
        sinon.match({ id: service.id, selector: service.selector }),
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET,
        { key: 'upcoming_releases', settings: { region: 'FR', period_days: '30' }, language: 'fr', units: 'metric' },
        { timeoutMs: WIDGET_GET_TIMEOUT_MS },
      );
      expect(response.content.version).to.equal(1);
      expect(response.content).to.not.have.property('ttl_seconds');
      expect(response.content.components).to.have.lengthOf(3);
      expect(response.content.components[0].text).to.deep.equal({ en: 'Next 30 days', fr: '30 prochains jours' });
      const expiresAt = new Date(response.expires_at).getTime();
      expect(expiresAt).to.be.within(before + 1800 * 1000 - 1000, Date.now() + 1800 * 1000 + 1000);
      // a hit: same expiry, no second command
      const second = await externalIntegration.getWidgetContent(
        service.selector,
        'upcoming_releases',
        { region: 'FR' },
        PREFERENCES,
      );
      expect(second).to.deep.equal(response);
      expect(externalIntegration.sendCommand.callCount).to.equal(1);
      // the cache key is canonical: key order does not matter
      await externalIntegration.getWidgetContent(
        service.selector,
        'upcoming_releases',
        { period_days: '30', region: 'FR' },
        PREFERENCES,
      );
      expect(externalIntegration.sendCommand.callCount).to.equal(1);
    });

    it('should re-pull an expired entry', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.sendCommand = resolvingCommand({ ...CINEMA_CONTENT, ttl_seconds: 10 });
      await externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      const cache = externalIntegration.widgetContentCache.get(service.id);
      const [entry] = [...cache.values()];
      entry.expiresAt = Date.now() - 1;
      await externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      expect(externalIntegration.sendCommand.callCount).to.equal(2);
    });

    it('should keep one entry and one command per language and unit system', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.sendCommand = resolvingCommand();
      await externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      await externalIntegration.getWidgetContent(
        service.selector,
        'upcoming_releases',
        {},
        {
          language: 'en',
          units: 'metric',
        },
      );
      await externalIntegration.getWidgetContent(
        service.selector,
        'upcoming_releases',
        {},
        {
          language: 'en',
          units: 'us',
        },
      );
      expect(externalIntegration.sendCommand.callCount).to.equal(3);
      expect(externalIntegration.widgetContentCache.get(service.id).size).to.equal(3);
      expect(externalIntegration.sendCommand.secondCall.args[2]).to.include({ language: 'en', units: 'metric' });
    });

    it('should coalesce concurrent misses for one cache key onto one command', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const deferred = deferredCommand();
      externalIntegration.sendCommand = deferred.fake;
      const first = externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      const second = externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      await waitForCalls(deferred.fake, 1);
      expect(deferred.fake.callCount).to.equal(1);
      deferred.resolve(0);
      const [firstResponse, secondResponse] = await Promise.all([first, second]);
      expect(firstResponse).to.deep.equal(secondResponse);
      expect(externalIntegration.widgetInFlight.get(service.id).size).to.equal(0);
    });

    it('should serve but never cache a result that arrives after a nudge, and start a new command', async () => {
      const { externalIntegration, event } = buildSupervisor();
      const service = await seedWidgetService();
      const deferred = deferredCommand();
      externalIntegration.sendCommand = deferred.fake;
      const stale = externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      await waitForCalls(deferred.fake, 1);
      externalIntegration.handleWidgetRefresh(service, { key: 'upcoming_releases' });
      sinonAssert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_UPDATED,
        payload: { selector: service.selector, key: 'upcoming_releases' },
      });
      // a request arriving after the nudge does not join the stale command
      const fresh = externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      await waitForCalls(deferred.fake, 2);
      expect(deferred.fake.callCount).to.equal(2);
      deferred.resolve(0, { ...CINEMA_CONTENT, components: [{ type: 'text', text: 'stale' }] });
      const staleResponse = await stale;
      expect(staleResponse.content.components[0].text).to.equal('stale');
      expect(externalIntegration.widgetContentCache.get(service.id).size).to.equal(0);
      deferred.resolve(1, { ...CINEMA_CONTENT, components: [{ type: 'text', text: 'fresh' }] });
      const freshResponse = await fresh;
      expect(freshResponse.content.components[0].text).to.equal('fresh');
      const [entry] = [...externalIntegration.widgetContentCache.get(service.id).values()];
      expect(entry.components[0].text).to.equal('fresh');
    });

    it('should keep at most 2 widget.get commands in flight per integration and queue the others', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const deferred = deferredCommand();
      externalIntegration.sendCommand = deferred.fake;
      const requests = ['FR', 'DE', 'IT'].map((region) =>
        externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', { region }, PREFERENCES),
      );
      await waitForCalls(deferred.fake, 2);
      expect(deferred.fake.callCount).to.equal(2);
      deferred.resolve(0);
      await waitForCalls(deferred.fake, 3);
      expect(deferred.fake.callCount).to.equal(3);
      deferred.resolve(1);
      deferred.resolve(2);
      await Promise.all(requests);
      expect(externalIntegration.widgetPullSlots.get(service.id).active).to.equal(0);
    });

    it('should answer 429 beyond 30 cache misses per minute per integration', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.sendCommand = resolvingCommand();
      externalIntegration.widgetPullRates.set(service.id, { count: 30, resetAt: Date.now() + 60 * 1000 });
      await expect(
        externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES),
      ).to.be.rejectedWith(TooManyRequests);
      sinonAssert.notCalled(externalIntegration.sendCommand);
      // the window resets
      externalIntegration.widgetPullRates.set(service.id, { count: 30, resetAt: Date.now() - 1 });
      await externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      sinonAssert.calledOnce(externalIntegration.sendCommand);
    });

    it('should keep at most 50 entries per integration in LRU order', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.sendCommand = resolvingCommand();
      externalIntegration.widgetPullRates.set(service.id, { count: -1000, resetAt: Date.now() + 60 * 1000 });
      // eslint-disable-next-line no-restricted-syntax
      for (let index = 0; index < 51; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await externalIntegration.getWidgetContent(
          service.selector,
          'upcoming_releases',
          { region: `R${index}` },
          PREFERENCES,
        );
      }
      const cache = externalIntegration.widgetContentCache.get(service.id);
      expect(cache.size).to.equal(50);
      const settings = { region: 'R0', period_days: '30' };
      expect(cache.has(`upcoming_releases:${canonicalJson(settings)}:fr:metric`)).to.equal(false);
    });

    it('should validate the settings: unknown key, invalid value, bounds, required, dynamic devices', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.sendCommand = resolvingCommand();
      const expect422 = async (widgetKey, settings, message) => {
        try {
          await externalIntegration.getWidgetContent(service.selector, widgetKey, settings, PREFERENCES);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(Error422);
          expect(e.properties).to.include(message);
        }
      };
      await expect422('upcoming_releases', { foo: 'bar' }, 'settings.foo: unknown setting');
      await expect422('upcoming_releases', { period_days: '90' }, 'settings.period_days: must be one of 15, 30');
      await expect422('upcoming_releases', { region: 'x'.repeat(101) }, 'settings.region: must be at most 100');
      await expect422('upcoming_releases', [], 'settings: must be an object');
      const tooMany = {};
      Array.from({ length: 11 }, (value, index) => index).forEach((index) => {
        tooMany[`k${index}`] = 'v';
      });
      await expect422('upcoming_releases', tooMany, 'settings: at most 10 keys');
      const bigList = { region: 'FR', period_days: '30' };
      // 1 KB serialized: many short strings in a multi_select-like array
      bigList.list = Array.from({ length: 200 }, () => 'abcde');
      await expect422('upcoming_releases', bigList, 'settings: must be at most 1024 bytes serialized');
      await expect422('vacuum', {}, 'settings.device: required');
      await expect422('vacuum', { device: 'ext:other:s7' }, 'settings.device: must be one of the devices');
      const { device } = await seedVacuum(service);
      await externalIntegration.getWidgetContent(
        service.selector,
        'vacuum',
        { device: device.external_id },
        PREFERENCES,
      );
      expect(externalIntegration.sendCommand.lastCall.args[2].settings).to.deep.equal({ device: device.external_id });
    });

    it('should translate command failures into 400 REQUEST_TO_THIRD_PARTY_FAILED with the bounded integration error', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const expect400 = async (message, expectedError) => {
        try {
          await externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(Error400);
          expect(e.message).to.equal(message);
          expect(e.error).to.equal(expectedError);
        }
      };
      externalIntegration.sendCommand = fake.rejects(
        new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_NOT_CONNECTED'),
      );
      await expect400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED, undefined);
      externalIntegration.sendCommand = fake.rejects(new ExternalIntegrationUnavailableError('x'.repeat(250)));
      await expect400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED, 'x'.repeat(200));
      externalIntegration.sendCommand = fake.resolves({ success: true, data: {} });
      await expect400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED, undefined);
      externalIntegration.sendCommand = resolvingCommand({ version: 2, components: [] });
      await expect400(ERROR_MESSAGES.WIDGET_CONTENT_VERSION_UNSUPPORTED, undefined);
      // anything else is not translated
      externalIntegration.sendCommand = fake.rejects(new Error('boom'));
      await expect(
        externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES),
      ).to.be.rejectedWith(Error, 'boom');
      expect(externalIntegration.widgetPullSlots.get(service.id).active).to.equal(0);
    });

    it('should resolve device references within the tenant and drop foreign or invalid ones', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const other = await seedExternalService({ name: 'ext-dev-other', selector: 'ext-dev-other' });
      const { battery, dock } = await seedVacuum(service);
      const foreign = await seedVacuum(other, {
        selector: 'other-s7',
        name: 'Other',
        external_id: 'ext:ext-dev-other:s7',
      });
      externalIntegration.sendCommand = resolvingCommand({
        components: [
          { type: 'value', device_feature: battery.external_id, label: 'Battery' },
          { type: 'gauge', device_feature: battery.external_id },
          { type: 'gauge', device_feature: battery.external_id, min: 10, max: 90 },
          { type: 'value', device_feature: foreign.battery.external_id },
          { type: 'button', label: 'Dock', device_feature: dock.external_id, value: 1 },
          { type: 'button', label: 'Too high', device_feature: dock.external_id, value: 5 },
          { type: 'button', label: 'Read only', device_feature: battery.external_id, value: 1 },
          { type: 'chart', device_features: [battery.external_id, dock.external_id], interval: 'last-week' },
          { type: 'chart', device_features: [battery.external_id, foreign.dock.external_id] },
        ],
      });
      const { content } = await externalIntegration.getWidgetContent(
        service.selector,
        'vacuum',
        { device: `ext:${service.selector}:s7` },
        PREFERENCES,
      );
      expect(content.components).to.deep.equal([
        {
          type: 'value',
          device_feature: battery.external_id,
          label: 'Battery',
          device_feature_selector: 'roborock-s7-battery',
        },
        {
          type: 'gauge',
          device_feature: battery.external_id,
          device_feature_selector: 'roborock-s7-battery',
          min: 0,
          max: 100,
        },
        {
          type: 'gauge',
          device_feature: battery.external_id,
          min: 10,
          max: 90,
          device_feature_selector: 'roborock-s7-battery',
        },
        {
          type: 'button',
          label: 'Dock',
          style: 'secondary',
          device_feature: dock.external_id,
          value: 1,
          device_feature_selector: 'roborock-s7-dock',
        },
        {
          type: 'chart',
          chart_type: 'line',
          device_features: [battery.external_id, dock.external_id],
          interval: 'last-week',
          device_feature_selectors: ['roborock-s7-battery', 'roborock-s7-dock'],
        },
      ]);
      // a chart referencing a foreign feature is dropped as a whole, a
      // component without any reference goes through untouched
      externalIntegration.sendCommand = resolvingCommand({
        components: [
          { type: 'text', text: 'Plain' },
          { type: 'chart', device_features: [battery.external_id, foreign.dock.external_id] },
        ],
      });
      const english = await externalIntegration.getWidgetContent(
        service.selector,
        'vacuum',
        { device: `ext:${service.selector}:s7` },
        { language: 'en', units: 'metric' },
      );
      expect(english.content.components).to.deep.equal([{ type: 'text', variant: 'body', text: 'Plain' }]);
    });
  });

  describe('canonicalJson', () => {
    it('should sort keys at every depth and keep arrays in order', () => {
      expect(canonicalJson({ b: 1, a: [2, { d: null, c: 'x' }], e: true })).to.equal(
        '{"a":[2,{"c":"x","d":null}],"b":1,"e":true}',
      );
    });
  });

  describe('handleWidgetRefresh', () => {
    it('should ignore a nudge for an undeclared widget or without a key', async () => {
      const { externalIntegration, event } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.handleWidgetRefresh(service, { key: 'nope' });
      externalIntegration.handleWidgetRefresh(service, {});
      externalIntegration.handleWidgetRefresh(service);
      externalIntegration.handleWidgetRefresh({ ...service, manifest: TEST_MANIFEST }, { key: 'vacuum' });
      sinonAssert.notCalled(event.emit);
    });

    it('should drop the cached contents of the widget only and rate-limit to one nudge per 10 s', async () => {
      const { externalIntegration, event } = buildSupervisor();
      const service = await seedWidgetService();
      const { device } = await seedVacuum(service);
      externalIntegration.sendCommand = resolvingCommand();
      await externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      await externalIntegration.getWidgetContent(
        service.selector,
        'vacuum',
        { device: device.external_id },
        PREFERENCES,
      );
      const cache = externalIntegration.widgetContentCache.get(service.id);
      expect(cache.size).to.equal(2);
      externalIntegration.handleWidgetRefresh(service, { key: 'vacuum' });
      expect(cache.size).to.equal(1);
      expect([...cache.values()][0].widgetKey).to.equal('upcoming_releases');
      expect(externalIntegration.getWidgetGeneration(service.id, 'vacuum')).to.equal(1);
      expect(event.emit.callCount).to.equal(1);
      externalIntegration.handleWidgetRefresh(service, { key: 'vacuum' });
      expect(event.emit.callCount).to.equal(1);
      expect(externalIntegration.getWidgetGeneration(service.id, 'vacuum')).to.equal(1);
      externalIntegration.widgetRefreshTimes.set(`${service.id}:vacuum`, Date.now() - 11 * 1000);
      externalIntegration.handleWidgetRefresh(service, { key: 'vacuum' });
      expect(event.emit.callCount).to.equal(2);
      expect(externalIntegration.getWidgetGeneration(service.id, 'vacuum')).to.equal(2);
    });
  });

  describe('lifecycle', () => {
    it('should drop every widget cache and counter of an integration', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const other = await seedExternalService({ name: 'ext-dev-other', selector: 'ext-dev-other' });
      externalIntegration.sendCommand = resolvingCommand();
      await externalIntegration.getWidgetContent(service.selector, 'upcoming_releases', {}, PREFERENCES);
      externalIntegration.handleWidgetRefresh(service, { key: 'upcoming_releases' });
      externalIntegration.widgetImageCache.set(service.id, new Map([['poster-1', { image: 'x', expiresAt: 1 }]]));
      externalIntegration.widgetActionRates.set(service.id, { count: 1, resetAt: 1 });
      externalIntegration.widgetGenerations.set(`${other.id}:x`, 3);
      externalIntegration.clearWidgetCaches(service);
      expect(externalIntegration.widgetContentCache.has(service.id)).to.equal(false);
      expect(externalIntegration.widgetImageCache.has(service.id)).to.equal(false);
      expect(externalIntegration.widgetPullRates.has(service.id)).to.equal(false);
      expect(externalIntegration.widgetActionRates.has(service.id)).to.equal(false);
      expect(externalIntegration.widgetRefreshTimes.has(`${service.id}:upcoming_releases`)).to.equal(false);
      expect(externalIntegration.getWidgetGeneration(service.id, 'upcoming_releases')).to.equal(0);
      // another integration is untouched
      expect(externalIntegration.widgetGenerations.get(`${other.id}:x`)).to.equal(3);
    });

    it('should clear the widget caches when the integration stops or is uninstalled', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.clearWidgetCaches = fake.returns(null);
      await externalIntegration.stop(service.selector);
      sinonAssert.calledOnce(externalIntegration.clearWidgetCaches);
      expect(externalIntegration.clearWidgetCaches.firstCall.args[0].id).to.equal(service.id);
      await externalIntegration.uninstall(service.selector);
      sinonAssert.calledTwice(externalIntegration.clearWidgetCaches);
    });
  });
});
