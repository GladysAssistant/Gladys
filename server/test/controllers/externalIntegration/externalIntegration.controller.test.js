const { expect } = require('chai');
const { fake } = require('sinon');

const db = require('../../../models');
const { authenticatedRequest, request: unAuthenticatedRequest } = require('../request.test');
const { SERVICE_STATUS, SERVICE_TYPES } = require('../../../utils/constants');

const TEST_MANIFEST = {
  manifest_version: 1,
  type: 'device',
  name: 'Open-Meteo Demo',
  description: { en: 'Weather sensor and virtual switch demo integration.' },
  version: '1.2.0',
  docker_image: 'ghcr.io/john/gladys-open-meteo-demo:1.2.0',
  gladys_version: '>=0.1.0',
  config_schema: [
    { key: 'latitude', type: 'number', label: { en: 'Latitude' }, min: -90, max: 90 },
    { key: 'api_key', type: 'secret', label: { en: 'API key' } },
  ],
};

const seedExternalService = async (overrides = {}) =>
  (
    await db.Service.create({
      name: 'ext-dev-open-meteo-demo',
      selector: 'ext-dev-open-meteo-demo',
      version: '1.2.0',
      status: SERVICE_STATUS.RUNNING,
      type: SERVICE_TYPES.EXTERNAL,
      docker_image: TEST_MANIFEST.docker_image,
      manifest: TEST_MANIFEST,
      token_version: 1,
      ...overrides,
    })
  ).get({ plain: true });

describe('External integration admin API', () => {
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
    gladys.externalIntegration.available = false;
    gladys.externalIntegration.discoveredDevices.clear();
    gladys.externalIntegration.stateRateLimits.clear();
    gladys.externalIntegration.connections.clear();
    gladys.externalIntegration.storeIndex = null;
    gladys.externalIntegration.storeIndexFetchedAt = 0;
  });

  describe('GET /api/v1/external_integration', () => {
    it('should return the list of external integrations', async () => {
      const service = await seedExternalService();
      const res = await authenticatedRequest
        .get('/api/v1/external_integration')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.include({
        selector: service.selector,
        status: SERVICE_STATUS.RUNNING,
        update_available: false,
      });
    });

    it('should return 401 when not authenticated', async () => {
      await unAuthenticatedRequest.get('/api/v1/external_integration').expect(401);
    });
  });

  describe('GET /api/v1/external_integration/:selector', () => {
    it('should return the integration detail', async () => {
      const service = await seedExternalService();
      const res = await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}`)
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.have.property('selector', service.selector);
      expect(res.body.manifest).to.deep.equal(TEST_MANIFEST);
    });

    it('should return 404 on unknown selector', async () => {
      await authenticatedRequest.get('/api/v1/external_integration/ext-unknown').expect(404);
    });
  });

  describe('GET /api/v1/external_integration/store', () => {
    it('should return the store catalog, not the :selector handler (route order)', async () => {
      gladys.externalIntegration.storeIndex = {
        index_format: 1,
        integrations: [
          {
            store_slug: 'john/gladys-open-meteo-demo',
            repo_url: 'https://github.com/john/gladys-open-meteo-demo',
            manifest: TEST_MANIFEST,
            cover_url: null,
            github: { stars: 12, pushed_at: '2026-07-10T12:00:00.000Z' },
          },
        ],
      };
      gladys.externalIntegration.storeIndexFetchedAt = Date.now();
      const res = await authenticatedRequest
        .get('/api/v1/external_integration/store')
        .expect('Content-Type', /json/)
        .expect(200);
      // if the route order was broken, the :selector handler would 404
      expect(res.body).to.have.property('integrations');
      expect(res.body.integrations).to.have.lengthOf(1);
      expect(res.body.integrations[0]).to.include({ installed: false, compatible: true });
    });
  });

  describe('POST /api/v1/external_integration/store/refresh', () => {
    it('should refresh the index and return the catalog', async () => {
      stubInstance(
        gladys.externalIntegration,
        'refreshIndex',
        fake(async () => {
          gladys.externalIntegration.storeIndex = { index_format: 1, integrations: [] };
          gladys.externalIntegration.storeIndexFetchedAt = Date.now();
          return gladys.externalIntegration.storeIndex;
        }),
      );
      const res = await authenticatedRequest
        .post('/api/v1/external_integration/store/refresh')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body.integrations).to.deep.equal([]);
      expect(gladys.externalIntegration.refreshIndex.called).to.equal(true);
    });
  });

  describe('POST /api/v1/external_integration', () => {
    it('should install in dev mode by docker image', async () => {
      gladys.externalIntegration.available = true;
      stubInstance(gladys.system, 'pull', fake.resolves(true));
      stubInstance(gladys.system, 'createContainer', fake.resolves({ id: 'container-1' }));
      stubInstance(gladys.system, 'removeContainer', fake.resolves(true));
      stubInstance(gladys.system, 'restartContainer', fake.resolves(true));
      stubInstance(gladys.system, 'createNetwork', fake.resolves(true));
      stubInstance(gladys.system, 'getNetworkMode', fake.resolves('host'));
      stubInstance(gladys.system, 'inspectNetwork', fake.resolves({ IPAM: { Config: [{ Gateway: '172.30.0.1' }] } }));
      stubInstance(gladys.system, 'getGladysBasePath', fake.resolves({ basePathOnHost: '/var/lib/gladysassistant' }));
      const res = await authenticatedRequest
        .post('/api/v1/external_integration')
        .send({ docker_image: TEST_MANIFEST.docker_image, manifest: TEST_MANIFEST })
        .expect('Content-Type', /json/)
        .expect(201);
      expect(res.body).to.have.property('selector', 'ext-dev-open-meteo-demo');
      gladys.externalIntegration.clearTimers(res.body.id);
    });

    it('should install from the store by store_slug', async () => {
      stubInstance(
        gladys.externalIntegration,
        'installFromStore',
        fake.resolves({ selector: 'ext-john-gladys-open-meteo-demo' }),
      );
      const res = await authenticatedRequest
        .post('/api/v1/external_integration')
        .send({ store_slug: 'john/gladys-open-meteo-demo' })
        .expect(201);
      expect(res.body).to.have.property('selector', 'ext-john-gladys-open-meteo-demo');
    });

    it('should install from a GitHub repo URL', async () => {
      stubInstance(
        gladys.externalIntegration,
        'installFromRepoUrl',
        fake.resolves({ selector: 'ext-john-gladys-open-meteo-demo' }),
      );
      await authenticatedRequest
        .post('/api/v1/external_integration')
        .send({ repo_url: 'https://github.com/john/gladys-open-meteo-demo' })
        .expect(201);
    });

    it('should return 400 without install mode', async () => {
      await authenticatedRequest
        .post('/api/v1/external_integration')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/external_integration/:selector/start|stop|restart|update', () => {
    it('should call the supervisor actions', async () => {
      const service = await seedExternalService();
      const detail = { selector: service.selector, status: SERVICE_STATUS.LOADING };
      stubInstance(gladys.externalIntegration, 'start', fake.resolves(detail));
      stubInstance(gladys.externalIntegration, 'stop', fake.resolves(detail));
      stubInstance(gladys.externalIntegration, 'restart', fake.resolves(detail));
      stubInstance(gladys.externalIntegration, 'update', fake.resolves(detail));
      await authenticatedRequest.post(`/api/v1/external_integration/${service.selector}/start`).expect(200);
      await authenticatedRequest.post(`/api/v1/external_integration/${service.selector}/stop`).expect(200);
      await authenticatedRequest.post(`/api/v1/external_integration/${service.selector}/restart`).expect(200);
      await authenticatedRequest.post(`/api/v1/external_integration/${service.selector}/update`).expect(200);
      expect(gladys.externalIntegration.start.calledWith(service.selector)).to.equal(true);
      expect(gladys.externalIntegration.update.calledWith(service.selector)).to.equal(true);
    });
  });

  describe('GET /api/v1/external_integration/:selector/logs', () => {
    it('should return the logs', async () => {
      const service = await seedExternalService();
      stubInstance(gladys.externalIntegration, 'getLogs', fake.resolves('some logs'));
      const res = await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/logs?lines=50`)
        .expect(200);
      expect(res.body).to.deep.equal({ logs: 'some logs' });
      expect(gladys.externalIntegration.getLogs.calledWith(service.selector, '50')).to.equal(true);
    });
  });

  describe('GET /api/v1/external_integration/:selector/discovered_device', () => {
    it('should return the discovered devices with the created flag', async () => {
      const service = await seedExternalService();
      gladys.externalIntegration.discoveredDevices.set(service.id, [
        { name: 'Météo Paris', external_id: `ext:${service.selector}:paris`, features: [], params: [] },
      ]);
      const res = await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/discovered_device`)
        .expect(200);
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property('created', false);
    });
  });

  describe('POST /api/v1/external_integration/:selector/scan', () => {
    it('should relay the scan request when connected', async () => {
      const service = await seedExternalService();
      const ws = { readyState: 1, send: fake.returns(null) };
      gladys.externalIntegration.connections.set(service.id, ws);
      await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/scan`)
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ success: true });
        });
      expect(ws.send.called).to.equal(true);
    });

    it('should return 400 when the integration is disconnected', async () => {
      const service = await seedExternalService();
      await authenticatedRequest.post(`/api/v1/external_integration/${service.selector}/scan`).expect(400);
    });
  });

  describe('GET/POST /api/v1/external_integration/:selector/config', () => {
    it('should save then return the config, secrets never in clear', async () => {
      const service = await seedExternalService();
      const postRes = await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/config`)
        .send({ config: { latitude: 48.85, api_key: 's3cr3t' } })
        .expect(200);
      expect(postRes.body.config).to.deep.equal({ latitude: 48.85, api_key: null });
      expect(postRes.body.configured_secrets).to.deep.equal(['api_key']);
      const getRes = await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/config`)
        .expect(200);
      expect(getRes.body.config).to.deep.equal({ latitude: 48.85, api_key: null });
    });

    it('should return 422 on invalid config', async () => {
      const service = await seedExternalService();
      await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/config`)
        .send({ config: { latitude: 200 } })
        .expect(422);
      await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/config`)
        .send({ config: { unknown_key: 1 } })
        .expect(422);
    });
  });

  describe('DELETE /api/v1/external_integration/:selector', () => {
    it('should uninstall the integration', async () => {
      const service = await seedExternalService({ container_id: null });
      await authenticatedRequest
        .delete(`/api/v1/external_integration/${service.selector}`)
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ success: true });
        });
      const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
      expect(serviceInDb).to.equal(null);
    });
  });

  describe('GET /api/v1/external_integration/hardware', () => {
    it('should return the detected classes, not the :selector handler (route order)', async () => {
      stubInstance(
        gladys.system,
        'detectHardwareClasses',
        fake.resolves([
          { class: 'coral-usb', detected: true, paths: ['/dev/bus/usb'] },
          { class: 'gpu', detected: false, paths: [] },
        ]),
      );
      const res = await authenticatedRequest
        .get('/api/v1/external_integration/hardware')
        .expect('Content-Type', /json/)
        .expect(200);
      // the paths never reach the frontend
      expect(res.body).to.deep.equal({
        classes: [
          { class: 'coral-usb', detected: true },
          { class: 'gpu', detected: false },
        ],
      });
    });
  });

  describe('POST /api/v1/external_integration/:selector/hardware', () => {
    it('should persist the granted classes and return the detail', async () => {
      const service = await seedExternalService({
        manifest: {
          ...TEST_MANIFEST,
          containers: [{ name: 'frigate', docker_image: 'img:1.0.0', devices: ['coral-usb'] }],
        },
      });
      stubInstance(gladys.system, 'detectHardwareClasses', fake.resolves([]));
      const res = await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/hardware`)
        .send({ granted_devices: ['coral-usb'] })
        .expect(200);
      expect(res.body.granted_devices).to.deep.equal(['coral-usb']);
      expect(res.body.containers).to.have.lengthOf(1);
      const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
      expect(serviceInDb.granted_devices).to.deep.equal(['coral-usb']);
    });

    it('should return 422 on classes not requested by the manifest', async () => {
      const service = await seedExternalService();
      await authenticatedRequest
        .post(`/api/v1/external_integration/${service.selector}/hardware`)
        .send({ granted_devices: ['coral-usb'] })
        .expect(422);
    });
  });

  describe('multi-container detail and logs', () => {
    it('should include the sub-containers state in the detail', async () => {
      const service = await seedExternalService({
        manifest: {
          ...TEST_MANIFEST,
          containers: [
            {
              name: 'frigate',
              docker_image: 'img:1.0.0',
              ports: [{ container_port: 5000, label: { en: 'Frigate UI' } }],
            },
          ],
        },
      });
      stubInstance(gladys.system, 'detectHardwareClasses', fake.resolves([]));
      const res = await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}`)
        .expect(200);
      expect(res.body.containers).to.deep.equal([
        {
          name: 'frigate',
          status: 'stopped',
          desired: 'running',
          started_at: null,
          ports: [{ container_port: 5000, protocol: 'tcp', host_port: null, label: { en: 'Frigate UI' } }],
          devices: [],
        },
      ]);
    });

    it('should relay the container query param of the logs endpoint', async () => {
      const service = await seedExternalService();
      stubInstance(gladys.externalIntegration, 'getLogs', fake.resolves('mqtt logs'));
      await authenticatedRequest
        .get(`/api/v1/external_integration/${service.selector}/logs?lines=50&container=mqtt`)
        .expect(200);
      expect(gladys.externalIntegration.getLogs.calledWith(service.selector, '50', 'mqtt')).to.equal(true);
    });
  });
});
