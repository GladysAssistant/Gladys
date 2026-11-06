const { expect } = require('chai');

const db = require('../../../models');
const {
  authenticatedRequest,
  nonAdminRequest,
  NON_ADMIN_USER_ID,
  request: unAuthenticatedRequest,
} = require('../request.test');
const { SERVICE_STATUS, SERVICE_TYPES, SYSTEM_VARIABLE_NAMES, USER_ROLE } = require('../../../utils/constants');

const TEST_AI_MANIFEST = {
  manifest_version: 1,
  type: 'ai',
  name: 'Claude Provider Demo',
  description: { en: 'AI provider demo integration.' },
  version: '1.0.0',
  docker_image: 'ghcr.io/john/gladys-claude-provider:1.0.0',
  gladys_version: '>=0.1.0',
};

const TEST_DEVICE_MANIFEST = {
  ...TEST_AI_MANIFEST,
  type: 'device',
  name: 'Open-Meteo Demo',
  description: { en: 'Weather sensor demo integration.' },
  docker_image: 'ghcr.io/john/gladys-open-meteo-demo:1.2.0',
};

const seedNonAdminUser = () =>
  db.User.create({
    id: NON_ADMIN_USER_ID,
    firstname: 'Pepper',
    lastname: 'Potts',
    selector: 'pepper-habitant',
    email: 'pepper-habitant@pots.com',
    password: 'mysuperpassword',
    role: USER_ROLE.HABITANT,
    language: 'en',
    birthdate: '1990-12-12',
  });

const seedService = async (overrides = {}) =>
  (
    await db.Service.create({
      name: 'ext-dev-claude-provider-demo',
      selector: 'ext-dev-claude-provider-demo',
      version: '1.0.0',
      status: SERVICE_STATUS.RUNNING,
      type: SERVICE_TYPES.EXTERNAL,
      docker_image: TEST_AI_MANIFEST.docker_image,
      manifest: TEST_AI_MANIFEST,
      token_version: 1,
      ...overrides,
    })
  ).get({ plain: true });

describe('AI provider API', () => {
  let gladys;

  beforeEach(async () => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
    await gladys.variable.destroy(SYSTEM_VARIABLE_NAMES.AI_PROVIDER);
  });

  describe('GET /api/v1/ai_provider', () => {
    it('should return the Gladys Plus default and no provider', async () => {
      const res = await authenticatedRequest
        .get('/api/v1/ai_provider')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.deep.equal({ selector: null, providers: [] });
    });

    it('should list the installed AI providers and the current selection', async () => {
      const aiService = await seedService();
      await seedService({
        name: 'ext-dev-open-meteo-demo',
        selector: 'ext-dev-open-meteo-demo',
        manifest: TEST_DEVICE_MANIFEST,
        docker_image: TEST_DEVICE_MANIFEST.docker_image,
      });
      await gladys.variable.setValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER, aiService.selector);
      const res = await authenticatedRequest
        .get('/api/v1/ai_provider')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.deep.equal({
        selector: aiService.selector,
        providers: [{ selector: aiService.selector, name: TEST_AI_MANIFEST.name, status: SERVICE_STATUS.RUNNING }],
      });
    });

    it('should be readable by a non-admin user (the chat needs it)', async () => {
      await seedNonAdminUser();
      await nonAdminRequest.get('/api/v1/ai_provider').expect(200);
    });

    it('should refuse an unauthenticated request', async () => {
      await unAuthenticatedRequest.get('/api/v1/ai_provider').expect(401);
    });
  });

  describe('POST /api/v1/ai_provider', () => {
    it('should select an installed AI provider', async () => {
      const aiService = await seedService();
      const res = await authenticatedRequest
        .post('/api/v1/ai_provider')
        .send({ selector: aiService.selector })
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body.selector).to.equal(aiService.selector);
      expect(await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(aiService.selector);
    });

    it('should reset to Gladys Plus with a null selector (and with no selector at all)', async () => {
      const aiService = await seedService();
      await gladys.variable.setValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER, aiService.selector);
      const res = await authenticatedRequest
        .post('/api/v1/ai_provider')
        .send({ selector: null })
        .expect(200);
      expect(res.body.selector).to.equal(null);
      expect(await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(null);
      // omitted selector = reset too
      await gladys.variable.setValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER, aiService.selector);
      await authenticatedRequest
        .post('/api/v1/ai_provider')
        .send({})
        .expect(200);
      expect(await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(null);
    });

    it('should refuse an integration that is not an AI provider', async () => {
      const deviceService = await seedService({
        name: 'ext-dev-open-meteo-demo',
        selector: 'ext-dev-open-meteo-demo',
        manifest: TEST_DEVICE_MANIFEST,
        docker_image: TEST_DEVICE_MANIFEST.docker_image,
      });
      await authenticatedRequest
        .post('/api/v1/ai_provider')
        .send({ selector: deviceService.selector })
        .expect(400);
      expect(await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(null);
    });

    it('should refuse an unknown selector', async () => {
      await authenticatedRequest
        .post('/api/v1/ai_provider')
        .send({ selector: 'ext-unknown' })
        .expect(404);
    });

    it('should be admin-only', async () => {
      await seedNonAdminUser();
      await nonAdminRequest
        .post('/api/v1/ai_provider')
        .send({ selector: null })
        .expect(403);
    });
  });
});
