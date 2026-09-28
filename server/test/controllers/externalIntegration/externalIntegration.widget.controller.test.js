const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const { authenticatedRequest, nonAdminRequest, NON_ADMIN_USER_ID } = require('../request.test');
const {
  SERVICE_STATUS,
  SERVICE_TYPES,
  USER_ROLE,
  ERROR_MESSAGES,
  WEBSOCKET_MESSAGE_TYPES,
} = require('../../../utils/constants');

const WIDGET_MANIFEST = {
  manifest_version: 1,
  type: 'device',
  name: 'Roborock Demo',
  description: { en: 'Robot vacuum demo integration.' },
  version: '1.0.0',
  docker_image: 'ghcr.io/john/gladys-roborock:1.0.0',
  gladys_version: '>=4.62.0',
  widgets: [
    {
      key: 'vacuum',
      label: { en: 'Vacuum', fr: 'Aspirateur' },
      description: { en: 'State of the robot.' },
      icon: 'wind',
      settings: [
        {
          key: 'mode',
          type: 'select',
          label: { en: 'Mode' },
          default: 'compact',
          options: [
            { value: 'compact', label: { en: 'Compact' } },
            { value: 'full', label: { en: 'Full' } },
          ],
        },
      ],
      action_timeout_seconds: 20,
    },
    // a widget keyed `content`: it must never collide with the image route
    { key: 'content', label: { en: 'Content widget' } },
  ],
};

const CONTENT = {
  version: 1,
  ttl_seconds: 30,
  components: [
    { type: 'status', items: [{ label: 'State', value: 'Docked', color: 'success' }] },
    { type: 'image', key: 'content' },
    { type: 'button', label: 'Start', action: { key: 'start', params: { mode: 'full' } } },
  ],
};
const { buildPng } = require('../../helpers/widgetImages.test');

const PNG = buildPng();

const seedWidgetService = async (overrides = {}) =>
  (
    await db.Service.create({
      name: 'ext-dev-roborock',
      selector: 'ext-dev-roborock',
      version: '1.0.0',
      status: SERVICE_STATUS.RUNNING,
      type: SERVICE_TYPES.EXTERNAL,
      docker_image: WIDGET_MANIFEST.docker_image,
      manifest: WIDGET_MANIFEST,
      token_version: 1,
      ...overrides,
    })
  ).get({ plain: true });

const seedNonAdminUser = () =>
  db.User.create({
    id: NON_ADMIN_USER_ID,
    firstname: 'Pepper',
    lastname: 'Potts',
    selector: 'pepper-habitant',
    email: 'pepper-habitant@pots.com',
    password: 'mysuperpassword',
    role: USER_ROLE.HABITANT,
    language: 'fr',
    distance_unit_preference: 'us',
    birthdate: '1990-12-12',
  });

describe('External integration widgets API', () => {
  let gladys;
  const stubbedProps = [];

  const stubInstance = (object, key, value) => {
    object[key] = value;
    stubbedProps.push([object, key]);
  };

  beforeEach(() => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
  });

  afterEach(() => {
    stubbedProps.forEach(([object, key]) => {
      delete object[key];
    });
    stubbedProps.length = 0;
    [
      'widgetContentCache',
      'widgetInFlight',
      'widgetGenerations',
      'widgetPullSlots',
      'widgetPullRates',
      'widgetRefreshTimes',
      'widgetImageCache',
      'widgetImageInFlight',
      'widgetImageSlots',
      'widgetActionRates',
    ].forEach((state) => gladys.externalIntegration[state].clear());
    sinon.restore();
  });

  describe('GET /api/v1/external_integration/widget', () => {
    it('should list the widgets of a device integration to a non-admin, with the status and nothing else', async () => {
      await seedNonAdminUser();
      const service = await seedWidgetService({ status: SERVICE_STATUS.STOPPED });
      const res = await nonAdminRequest
        .get('/api/v1/external_integration/widget')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.have.lengthOf(2);
      expect(res.body[0]).to.deep.equal({
        integration_selector: service.selector,
        integration_name: 'Roborock Demo',
        integration_status: 'STOPPED',
        key: 'vacuum',
        label: { en: 'Vacuum', fr: 'Aspirateur' },
        description: { en: 'State of the robot.' },
        icon: 'wind',
        settings: WIDGET_MANIFEST.widgets[0].settings,
      });
      // while the integration itself stays hidden from the same user
      await nonAdminRequest.get(`/api/v1/external_integration/${service.selector}`).expect(404);
    });
  });

  describe('GET /api/v1/external_integration/:selector/widget/:key/content', () => {
    it('should 404 on an unknown integration or widget', async () => {
      const service = await seedWidgetService();
      await authenticatedRequest.get('/api/v1/external_integration/ext-nope/widget/vacuum/content').expect(404);
      await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/widget/nope/content`)
        .expect(404);
    });

    it('should 422 on malformed, oversized or invalid settings, naming the key', async () => {
      const service = await seedWidgetService();
      const base = `/api/v1/external_integration/${service.selector}/widget/vacuum/content`;
      await authenticatedRequest.get(`${base}?settings=not-json`).expect(422);
      await authenticatedRequest
        .get(`${base}?settings=${encodeURIComponent(JSON.stringify({ mode: 'x'.repeat(1100) }))}`)
        .expect(422);
      const res = await authenticatedRequest
        .get(`${base}?settings=${encodeURIComponent(JSON.stringify({ mode: 'turbo' }))}`)
        .expect(422);
      expect(res.body.properties).to.include('settings.mode: must be one of compact, full');
      const unknown = await authenticatedRequest
        .get(`${base}?settings=${encodeURIComponent(JSON.stringify({ speed: 3 }))}`)
        .expect(422);
      expect(unknown.body.properties).to.include('settings.speed: unknown setting');
      // an array of settings is a query-string shape, not an object
      await authenticatedRequest.get(`${base}?settings=a&settings=b`).expect(422);
    });

    it('should return the normalized content with the session language and units, defaults applied', async () => {
      await seedNonAdminUser();
      const service = await seedWidgetService();
      stubInstance(
        gladys.externalIntegration,
        'sendCommand',
        fake.resolves({ success: true, data: { content: CONTENT } }),
      );
      const res = await nonAdminRequest
        .get(`/api/v1/external_integration/${service.selector}/widget/vacuum/content?language=de&units=metric`)
        .expect(200);
      expect(gladys.externalIntegration.sendCommand.firstCall.args[2]).to.deep.equal({
        key: 'vacuum',
        settings: { mode: 'compact' },
        language: 'fr',
        units: 'us',
      });
      expect(res.body.content.version).to.equal(1);
      expect(res.body.content.components).to.have.lengthOf(3);
      expect(res.body.content.components[0].items[0]).to.deep.equal({
        label: 'State',
        value: 'Docked',
        color: 'success',
      });
      expect(new Date(res.body.expires_at).getTime()).to.be.within(Date.now() + 25 * 1000, Date.now() + 35 * 1000);
    });

    it('should translate an unavailable integration and an unsupported version into 400 codes', async () => {
      const service = await seedWidgetService();
      const url = `/api/v1/external_integration/${service.selector}/widget/vacuum/content`;
      // not connected: the real sendCommand throws immediately
      const disconnected = await authenticatedRequest.get(url).expect(400);
      expect(disconnected.body.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      expect(disconnected.body.error).to.equal(undefined);
      stubInstance(
        gladys.externalIntegration,
        'sendCommand',
        fake.resolves({ success: true, data: { content: { version: 2, components: [] } } }),
      );
      const unsupported = await authenticatedRequest.get(url).expect(400);
      expect(unsupported.body.message).to.equal(ERROR_MESSAGES.WIDGET_CONTENT_VERSION_UNSUPPORTED);
      gladys.externalIntegration.sendCommand = fake.rejects(new Error('EXTERNAL_INTEGRATION_COMMAND_FAILED'));
      // a plain Error is a 500, never silently mapped
      await authenticatedRequest.get(url).expect(500);
    });

    it('should 429 beyond the per-integration miss bound', async () => {
      const service = await seedWidgetService();
      gladys.externalIntegration.widgetPullRates.set(service.id, { count: 30, resetAt: Date.now() + 60 * 1000 });
      const res = await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/widget/vacuum/content`)
        .expect(429);
      expect(res.body.properties).to.deep.equal({ time_before_next: 60 });
    });
  });

  describe('GET /api/v1/external_integration/:selector/image/:image_key', () => {
    it('should 404 on an undeclared key without a command, and serve a declared one', async () => {
      const service = await seedWidgetService();
      const sendCommand = fake((target, type) =>
        Promise.resolve(
          type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET
            ? { success: true, data: { content: CONTENT } }
            : { success: true, data: { image: PNG.toString('base64') } },
        ),
      );
      stubInstance(gladys.externalIntegration, 'sendCommand', sendCommand);
      await authenticatedRequest.get(`/api/v1/external_integration/${service.selector}/image/content`).expect(404);
      expect(sendCommand.callCount).to.equal(0);
      // the content declares the `content` image key...
      await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/widget/vacuum/content`)
        .expect(200);
      // ...and the `content` widget keeps its own route: no collision
      await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/widget/content/content`)
        .expect(200);
      const res = await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/image/content`)
        .expect(200);
      expect(res.body.image).to.equal(`data:image/png;base64,${PNG.toString('base64')}`);
      expect(sendCommand.lastCall.args[1]).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET_IMAGE);
      await authenticatedRequest.get(`/api/v1/external_integration/${service.selector}/image/Bad%20Key`).expect(404);
    });
  });

  describe('POST /api/v1/external_integration/:selector/widget/:key/action/:action_key', () => {
    it('should run a declared action with the content params and return the message', async () => {
      const service = await seedWidgetService();
      const sendCommand = fake((target, type) =>
        Promise.resolve(
          type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET
            ? { success: true, data: { content: CONTENT } }
            : { success: true, data: { message: { en: 'Cleaning started' } } },
        ),
      );
      stubInstance(gladys.externalIntegration, 'sendCommand', sendCommand);
      const res = await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/widget/vacuum/action/start`)
        .send({ settings: { mode: 'full' } })
        .expect(200);
      expect(res.body).to.deep.equal({ message: { en: 'Cleaning started' } });
      expect(sendCommand.secondCall.args[2]).to.deep.equal({
        key: 'vacuum',
        action_key: 'start',
        params: { mode: 'full' },
        settings: { mode: 'full' },
      });
      expect(sendCommand.secondCall.args[3]).to.deep.equal({ timeoutMs: 20000 });
      // null when the integration returned nothing, and no body at all works
      gladys.externalIntegration.sendCommand = fake((target, type) =>
        Promise.resolve(
          type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET
            ? { success: true, data: { content: CONTENT } }
            : { success: true },
        ),
      );
      const empty = await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/widget/vacuum/action/start`)
        .expect(200);
      expect(empty.body).to.deep.equal({ message: null });
    });

    it('should 404 on an undeclared action, 429 beyond the rate limit, 400 when disconnected', async () => {
      const service = await seedWidgetService();
      stubInstance(
        gladys.externalIntegration,
        'sendCommand',
        fake.resolves({ success: true, data: { content: CONTENT } }),
      );
      await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/widget/vacuum/action/stop`)
        .send({})
        .expect(404);
      gladys.externalIntegration.widgetActionRates.set(service.id, { count: 30, resetAt: Date.now() + 60 * 1000 });
      await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/widget/vacuum/action/start`)
        .send({})
        .expect(429);
      gladys.externalIntegration.widgetActionRates.clear();
      delete gladys.externalIntegration.sendCommand;
      const res = await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/widget/vacuum/action/start`)
        .send({})
        .expect(400);
      expect(res.body.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    });
  });
});
