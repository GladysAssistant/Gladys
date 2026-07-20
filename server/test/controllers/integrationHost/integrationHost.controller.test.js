const { expect } = require('chai');
const request = require('supertest');

const db = require('../../../models');
const { generateIntegrationToken } = require('../../../utils/integrationToken');
const { generateAccessToken } = require('../../../utils/accessToken');
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
      status: SERVICE_STATUS.LOADING,
      type: SERVICE_TYPES.EXTERNAL,
      docker_image: TEST_MANIFEST.docker_image,
      manifest: TEST_MANIFEST,
      token_version: 1,
      ...overrides,
    })
  ).get({ plain: true });

const integrationRequest = (token) => ({
  get: (url) =>
    // @ts-ignore
    request(TEST_BACKEND_APP)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`),
  post: (url) =>
    // @ts-ignore
    request(TEST_BACKEND_APP)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`),
});

describe('Integration host API', () => {
  let gladys;
  let service;
  let token;

  beforeEach(async () => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
    service = await seedExternalService();
    token = generateIntegrationToken(service.id, 1, 'secret');
  });

  afterEach(() => {
    gladys.externalIntegration.discoveredDevices.clear();
    gladys.externalIntegration.stateRateLimits.clear();
    gladys.externalIntegration.clearTimers(service.id);
  });

  describe('authentication', () => {
    it('should return 401 without token', async () => {
      // @ts-ignore
      await request(TEST_BACKEND_APP)
        .get('/api/integration/v1/status')
        .expect(401);
    });

    it('should return 401 with an invalid token', async () => {
      await integrationRequest('invalid-token')
        .get('/api/integration/v1/status')
        .expect(401);
    });

    it('should return 401 with a user access token (wrong audience)', async () => {
      const userToken = generateAccessToken(
        '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        ['dashboard:write'],
        'baf1fa89-153b-4f2e-adf3-787e410ec291',
        'secret',
      );
      await integrationRequest(userToken)
        .get('/api/integration/v1/status')
        .expect(401);
    });

    it('should return 401 with a revoked token_version', async () => {
      const oldToken = generateIntegrationToken(service.id, 0, 'secret');
      await integrationRequest(oldToken)
        .get('/api/integration/v1/status')
        .expect(401);
    });

    it('should return 401 with a token forged for an internal service', async () => {
      // test-service is an internal service from the seeds
      const internalToken = generateIntegrationToken('a810b8db-6d04-4697-bed3-c4b72c996279', 0, 'secret');
      await integrationRequest(internalToken)
        .get('/api/integration/v1/status')
        .expect(401);
    });
  });

  describe('GET /api/integration/v1/status', () => {
    it('should return the gladys version and the service identity', async () => {
      const res = await integrationRequest(token)
        .get('/api/integration/v1/status')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.have.property('gladys_version');
      expect(res.body.service).to.deep.equal({
        id: service.id,
        selector: service.selector,
        status: SERVICE_STATUS.LOADING,
        version: '1.2.0',
      });
    });
  });

  describe('POST /api/integration/v1/heartbeat', () => {
    it('should update last_heartbeat and transition LOADING -> RUNNING', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/heartbeat')
        .send({})
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ success: true });
        });
      const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
      expect(serviceInDb.status).to.equal(SERVICE_STATUS.RUNNING);
      expect(serviceInDb.last_heartbeat).to.not.equal(null);
    });
  });

  describe('POST /api/integration/v1/connection_status', () => {
    it('should store the application-level status and expose it in memory', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/connection_status')
        .send({ connected: false, message: { en: 'Token expired, please reconnect.' } })
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ success: true });
        });
      expect(gladys.externalIntegration.getConnectionStatus(service.id)).to.deep.equal({
        connected: false,
        message: { en: 'Token expired, please reconnect.' },
      });
      gladys.externalIntegration.connectionStatuses.clear();
    });

    it('should refuse a malformed status', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/connection_status')
        .send({ connected: 'yes' })
        .expect(400);
    });
  });

  describe('POST /api/integration/v1/network_discovery/scan', () => {
    it('should run a declared capture and return the raw results', async () => {
      const discoveryService = await seedExternalService({
        name: 'ext-dev-tuya-demo',
        selector: 'ext-dev-tuya-demo',
        manifest: { ...TEST_MANIFEST, network_discovery: [{ type: 'udp-broadcast', ports: [6666] }] },
      });
      const discoveryToken = generateIntegrationToken(discoveryService.id, 1, 'secret');
      gladys.externalIntegration.scanUdpBroadcast = async () => [
        { source_ip: '192.168.1.20', source_port: 6666, payload_base64: 'dHV5YQ==' },
      ];
      try {
        const res = await integrationRequest(discoveryToken)
          .post('/api/integration/v1/network_discovery/scan')
          .send({ type: 'udp-broadcast', timeout_seconds: 1 })
          .expect(200);
        expect(res.body).to.deep.equal([{ source_ip: '192.168.1.20', source_port: 6666, payload_base64: 'dHV5YQ==' }]);
      } finally {
        delete gladys.externalIntegration.scanUdpBroadcast;
      }
    });

    it('should refuse a capture type not declared in the manifest', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/network_discovery/scan')
        .send({ type: 'udp-broadcast', timeout_seconds: 1 })
        .expect(403);
    });
  });

  describe('POST /api/integration/v1/discovered_device', () => {
    it('should publish the discovered devices', async () => {
      const res = await integrationRequest(token)
        .post('/api/integration/v1/discovered_device')
        .send({
          devices: [
            {
              name: 'Météo Paris',
              external_id: `ext:${service.selector}:paris`,
              features: [
                {
                  name: 'Température',
                  external_id: `ext:${service.selector}:paris:temperature`,
                  category: 'temperature-sensor',
                  type: 'decimal',
                  unit: 'celsius',
                  min: -50,
                  max: 60,
                  read_only: true,
                  has_feedback: false,
                  keep_history: true,
                },
              ],
            },
          ],
        })
        .expect(200);
      expect(res.body).to.deep.equal({ success: true, count: 1 });
    });

    it('should reject external ids outside the integration perimeter', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/discovered_device')
        .send({
          devices: [{ name: 'Intru', external_id: 'ext:another-integration:x', features: [] }],
        })
        .expect(400);
    });
  });

  describe('GET /api/integration/v1/device', () => {
    it('should only return the devices of the authenticated integration', async () => {
      await db.Device.create({
        service_id: service.id,
        name: 'My device',
        selector: 'ext-my-device',
        external_id: `ext:${service.selector}:mine`,
      });
      // a device of another service (tenant isolation)
      await db.Device.create({
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Not my device',
        selector: 'not-my-device',
        external_id: 'other:device',
      });
      const res = await integrationRequest(token)
        .get('/api/integration/v1/device')
        .expect(200);
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property('external_id', `ext:${service.selector}:mine`);
    });

    it('should not return the devices of another external integration', async () => {
      const otherService = await seedExternalService({
        name: 'ext-dev-other',
        selector: 'ext-dev-other',
      });
      await db.Device.create({
        service_id: otherService.id,
        name: 'Other integration device',
        selector: 'ext-other-device',
        external_id: 'ext:ext-dev-other:x',
      });
      const res = await integrationRequest(token)
        .get('/api/integration/v1/device')
        .expect(200);
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe('POST /api/integration/v1/state', () => {
    it('should accept a batch of states', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/state')
        .send({
          states: [{ device_feature_external_id: `ext:${service.selector}:paris:temperature`, state: 21.5 }],
        })
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ success: true });
        });
    });

    it('should reject states outside the integration perimeter', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/state')
        .send({
          states: [{ device_feature_external_id: 'ext:another-integration:x', state: 1 }],
        })
        .expect(400);
    });

    it('should rate limit to 300 states/minute', async () => {
      const batch = Array.from({ length: 100 }, () => ({
        device_feature_external_id: `ext:${service.selector}:x`,
        state: 1,
      }));
      await integrationRequest(token)
        .post('/api/integration/v1/state')
        .send({ states: batch })
        .expect(200);
      await integrationRequest(token)
        .post('/api/integration/v1/state')
        .send({ states: batch })
        .expect(200);
      await integrationRequest(token)
        .post('/api/integration/v1/state')
        .send({ states: batch })
        .expect(200);
      await integrationRequest(token)
        .post('/api/integration/v1/state')
        .send({ states: [batch[0]] })
        .expect(429);
    });
  });

  describe('GET/POST /api/integration/v1/config', () => {
    it('should save and return the config with secrets in clear', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/config')
        .send({ config: { latitude: 48.85, api_key: 's3cr3t', internal_state: 'step-2' } })
        .expect(200);
      const res = await integrationRequest(token)
        .get('/api/integration/v1/config')
        .expect(200);
      expect(res.body.config).to.deep.equal({
        latitude: 48.85,
        api_key: 's3cr3t',
        internal_state: 'step-2',
      });
    });

    it('should validate schema keys', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/config')
        .send({ config: { latitude: 'not-a-number' } })
        .expect(422);
    });
  });

  describe('/api/integration/v1/container', () => {
    const CONTAINERS_MANIFEST = {
      ...TEST_MANIFEST,
      containers: [
        { name: 'mqtt', docker_image: 'eclipse-mosquitto:2.0.18', start: 'manual' },
        {
          name: 'frigate',
          docker_image: 'ghcr.io/blakeblackshear/frigate:0.14.1',
          ports: [{ container_port: 5000, label: { en: 'Frigate UI' } }],
          devices: ['coral-usb'],
        },
      ],
    };
    const stubbedProps = [];
    const stubSystem = (key, value) => {
      gladys.system[key] = value;
      stubbedProps.push(key);
    };

    beforeEach(async () => {
      await db.Service.destroy({ where: { id: service.id } });
      service = await seedExternalService({ manifest: CONTAINERS_MANIFEST, granted_devices: ['coral-usb'] });
      token = generateIntegrationToken(service.id, 1, 'secret');
      gladys.externalIntegration.available = true;
      stubSystem('detectHardwareClasses', () =>
        Promise.resolve([{ class: 'coral-usb', detected: true, paths: ['/dev/bus/usb'] }]),
      );
      stubSystem('getContainers', () => Promise.resolve([]));
      stubSystem('createContainer', () => Promise.resolve({ id: 'sub-1' }));
      stubSystem('removeContainer', () => Promise.resolve(true));
      stubSystem('restartContainer', () => Promise.resolve(true));
      stubSystem('stopContainer', () => Promise.resolve(true));
      stubSystem('createNetwork', () => Promise.resolve(true));
      stubSystem('getGladysBasePath', () => Promise.resolve({ basePathOnHost: '/var/lib/gladysassistant' }));
    });

    afterEach(() => {
      gladys.externalIntegration.available = false;
      stubbedProps.forEach((key) => {
        delete gladys.system[key];
      });
      stubbedProps.length = 0;
    });

    it('should list the declared sub-containers with grants and ports', async () => {
      const res = await integrationRequest(token)
        .get('/api/integration/v1/container')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body.containers.map((container) => container.name)).to.deep.equal(['mqtt', 'frigate']);
      expect(res.body.containers[0].desired).to.equal('stopped');
      expect(res.body.containers[1].desired).to.equal('running');
      expect(res.body.containers[1].devices).to.deep.equal([{ class: 'coral-usb', granted: true, available: true }]);
    });

    it('should start, stop and restart a declared sub-container', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/container/mqtt/start')
        .send({ env: { MQTT_PASSWORD: 's3cr3t' } })
        .expect(200);
      await integrationRequest(token)
        .post('/api/integration/v1/container/mqtt/stop')
        .send({})
        .expect(200);
      await integrationRequest(token)
        .post('/api/integration/v1/container/mqtt/restart')
        .send({})
        .expect(200);
    });

    it('should return 400 on a reserved env key', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/container/mqtt/start')
        .send({ env: { GLADYS_INTEGRATION_TOKEN: 'stolen' } })
        .expect(400);
    });

    it('should return 404 on an undeclared container', async () => {
      await integrationRequest(token)
        .post('/api/integration/v1/container/unknown/start')
        .send({})
        .expect(404);
    });

    it('should not let an integration drive the containers of another one', async () => {
      // the other integration declares no `mqtt` container: its token sees a 404
      const otherService = await seedExternalService({
        name: 'ext-dev-other',
        selector: 'ext-dev-other',
        manifest: TEST_MANIFEST,
      });
      const otherToken = generateIntegrationToken(otherService.id, 1, 'secret');
      await integrationRequest(otherToken)
        .post('/api/integration/v1/container/mqtt/start')
        .send({})
        .expect(404);
      const res = await integrationRequest(otherToken)
        .get('/api/integration/v1/container')
        .expect(200);
      expect(res.body.containers).to.deep.equal([]);
    });
  });
});
