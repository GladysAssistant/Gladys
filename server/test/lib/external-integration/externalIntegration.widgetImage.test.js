const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { WEBSOCKET_MESSAGE_TYPES, ERROR_MESSAGES } = require('../../../utils/constants');
const { Error400 } = require('../../../utils/httpErrors');
const { NotFoundError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const {
  WIDGET_GET_TIMEOUT_MS,
  MAX_WIDGET_IMAGE_BYTES,
  MAX_WIDGET_IMAGE_CACHE_ENTRIES,
} = require('../../../lib/external-integration/constants');
const { normalizeWidgetImage } = require('../../../lib/external-integration/externalIntegration.normalizeWidgetImage');
const { buildSupervisor, seedExternalService, TEST_WIDGET_MANIFEST } = require('./testUtils.test');

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16, 1)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16, 1)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4, 0), Buffer.from('WEBP'), Buffer.alloc(16, 1)]);
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16, 1)]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

const expectInvalidImage = (rawBase64) => {
  try {
    normalizeWidgetImage(rawBase64);
    throw new Error('should have thrown');
  } catch (e) {
    expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
    expect(e.message).to.equal('EXTERNAL_INTEGRATION_INVALID_WIDGET_IMAGE');
  }
};

const seedWidgetService = (overrides = {}) => seedExternalService({ manifest: TEST_WIDGET_MANIFEST, ...overrides });

// a cached content declaring image keys: the allowlist of the image route
const declareImages = (externalIntegration, service, imageKeys, cacheKey = 'upcoming_releases:{}:fr:metric') => {
  const cache = new Map();
  cache.set(cacheKey, {
    widgetKey: 'upcoming_releases',
    version: 1,
    components: [],
    imageKeys,
    expiresAt: Date.now() + 60 * 1000,
  });
  externalIntegration.widgetContentCache.set(service.id, cache);
};

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

describe('externalIntegration widgets — images', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('normalizeWidgetImage', () => {
    it('should accept PNG, JPEG and WebP by magic numbers and return a data URI', () => {
      expect(normalizeWidgetImage(PNG.toString('base64'))).to.equal(`data:image/png;base64,${PNG.toString('base64')}`);
      expect(normalizeWidgetImage(JPEG.toString('base64'))).to.equal(
        `data:image/jpeg;base64,${JPEG.toString('base64')}`,
      );
      expect(normalizeWidgetImage(WEBP.toString('base64'))).to.equal(
        `data:image/webp;base64,${WEBP.toString('base64')}`,
      );
    });

    it('should refuse GIF, SVG, empty, non-string and oversized images', () => {
      expectInvalidImage(GIF.toString('base64'));
      expectInvalidImage(SVG.toString('base64'));
      expectInvalidImage('');
      expectInvalidImage(42);
      expectInvalidImage('!!!!');
      const big = Buffer.concat([PNG, Buffer.alloc(MAX_WIDGET_IMAGE_BYTES, 1)]);
      expectInvalidImage(big.toString('base64'));
      // one byte over, once decoded
      const justOver = Buffer.concat([PNG, Buffer.alloc(MAX_WIDGET_IMAGE_BYTES - PNG.length + 1, 1)]);
      expectInvalidImage(justOver.toString('base64'));
    });
  });

  describe('getWidgetImage', () => {
    it('should 404 on a malformed or undeclared key without sending anything', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: PNG.toString('base64') } });
      await expect(externalIntegration.getWidgetImage(service.selector, 'Bad Key')).to.be.rejectedWith(NotFoundError);
      await expect(externalIntegration.getWidgetImage(service.selector, 'poster-1')).to.be.rejectedWith(
        NotFoundError,
        'EXTERNAL_INTEGRATION_WIDGET_IMAGE_NOT_DECLARED',
      );
      declareImages(externalIntegration, service, ['poster-2']);
      await expect(externalIntegration.getWidgetImage(service.selector, 'poster-1')).to.be.rejectedWith(NotFoundError);
      await expect(externalIntegration.getWidgetImage('ext-nope', 'poster-1')).to.be.rejectedWith(NotFoundError);
      sinonAssert.notCalled(externalIntegration.sendCommand);
    });

    it('should relay widget.get-image for a declared key, validate, cache for an hour', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      declareImages(externalIntegration, service, ['poster-1']);
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: WEBP.toString('base64') } });
      const image = await externalIntegration.getWidgetImage(service.selector, 'poster-1');
      sinonAssert.calledOnceWithExactly(
        externalIntegration.sendCommand,
        sinon.match({ id: service.id, selector: service.selector }),
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET_IMAGE,
        { image_key: 'poster-1' },
        { timeoutMs: WIDGET_GET_TIMEOUT_MS },
      );
      expect(image).to.equal(`data:image/webp;base64,${WEBP.toString('base64')}`);
      expect(await externalIntegration.getWidgetImage(service.selector, 'poster-1')).to.equal(image);
      expect(externalIntegration.sendCommand.callCount).to.equal(1);
      const entry = externalIntegration.widgetImageCache.get(service.id).get('poster-1');
      expect(entry.expiresAt).to.be.within(Date.now() + 59 * 60 * 1000, Date.now() + 61 * 60 * 1000);
      // an expired entry is re-pulled
      entry.expiresAt = Date.now() - 1;
      await externalIntegration.getWidgetImage(service.selector, 'poster-1');
      expect(externalIntegration.sendCommand.callCount).to.equal(2);
    });

    it('should share one command between concurrent requests and cap the commands in flight at 4', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const keys = ['a', 'b', 'c', 'd', 'e'];
      declareImages(externalIntegration, service, keys);
      const pending = [];
      externalIntegration.sendCommand = fake(
        () =>
          new Promise((resolve) => {
            pending.push(resolve);
          }),
      );
      const requests = keys.map((key) => externalIntegration.getWidgetImage(service.selector, key));
      requests.push(externalIntegration.getWidgetImage(service.selector, 'a'));
      await waitForCalls(externalIntegration.sendCommand, 4);
      expect(externalIntegration.sendCommand.callCount).to.equal(4);
      pending[0]({ success: true, data: { image: PNG.toString('base64') } });
      await waitForCalls(externalIntegration.sendCommand, 5);
      expect(externalIntegration.sendCommand.callCount).to.equal(5);
      pending.slice(1).forEach((resolve) => resolve({ success: true, data: { image: PNG.toString('base64') } }));
      const images = await Promise.all(requests);
      expect(images[0]).to.equal(images[5]);
      expect(externalIntegration.widgetImageInFlight.get(service.id).size).to.equal(0);
      expect(externalIntegration.widgetImageSlots.get(service.id).active).to.equal(0);
    });

    it('should keep at most 100 images per integration in LRU order', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const keys = Array.from({ length: MAX_WIDGET_IMAGE_CACHE_ENTRIES + 1 }, (value, index) => `poster-${index}`);
      declareImages(externalIntegration, service, keys);
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: PNG.toString('base64') } });
      // eslint-disable-next-line no-restricted-syntax
      for (const key of keys) {
        // eslint-disable-next-line no-await-in-loop
        await externalIntegration.getWidgetImage(service.selector, key);
      }
      const cache = externalIntegration.widgetImageCache.get(service.id);
      expect(cache.size).to.equal(MAX_WIDGET_IMAGE_CACHE_ENTRIES);
      expect(cache.has('poster-0')).to.equal(false);
      expect(cache.has(`poster-${MAX_WIDGET_IMAGE_CACHE_ENTRIES}`)).to.equal(true);
    });

    it('should translate command failures and invalid bytes into 400 REQUEST_TO_THIRD_PARTY_FAILED', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      declareImages(externalIntegration, service, ['poster-1']);
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: GIF.toString('base64') } });
      await expect(externalIntegration.getWidgetImage(service.selector, 'poster-1')).to.be.rejectedWith(
        Error400,
        ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED,
      );
      externalIntegration.sendCommand = fake.rejects(
        new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT'),
      );
      await expect(externalIntegration.getWidgetImage(service.selector, 'poster-1')).to.be.rejectedWith(
        Error400,
        ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED,
      );
      expect(externalIntegration.widgetImageCache.get(service.id).size).to.equal(0);
      expect(externalIntegration.widgetImageSlots.get(service.id).active).to.equal(0);
    });

    it('should never serve one integration image keys declared by another integration', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      const other = await seedExternalService({
        name: 'ext-dev-other',
        selector: 'ext-dev-other',
        manifest: TEST_WIDGET_MANIFEST,
      });
      declareImages(externalIntegration, service, ['poster-1']);
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: PNG.toString('base64') } });
      await expect(externalIntegration.getWidgetImage(other.selector, 'poster-1')).to.be.rejectedWith(NotFoundError);
      sinonAssert.notCalled(externalIntegration.sendCommand);
    });
  });
});
