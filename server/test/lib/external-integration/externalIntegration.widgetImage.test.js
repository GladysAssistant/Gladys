const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const logger = require('../../../utils/logger');
const { WEBSOCKET_MESSAGE_TYPES, ERROR_MESSAGES } = require('../../../utils/constants');
const { Error400 } = require('../../../utils/httpErrors');
const { NotFoundError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const {
  WIDGET_GET_TIMEOUT_MS,
  MAX_WIDGET_IMAGE_BYTES,
  MAX_WIDGET_IMAGE_DIMENSION,
  MAX_WIDGET_IMAGE_CACHE_ENTRIES,
} = require('../../../lib/external-integration/constants');
const {
  normalizeWidgetImage,
  WIDGET_IMAGE_ERRORS,
} = require('../../../lib/external-integration/externalIntegration.normalizeWidgetImage');
const { buildSupervisor, seedExternalService, TEST_WIDGET_MANIFEST } = require('./testUtils.test');
const {
  buildPng,
  buildJpeg,
  buildWebp,
  buildWebpLossless,
  buildWebpExtended,
} = require('../../helpers/widgetImages.test');

const PNG = buildPng();
const JPEG = buildJpeg();
const WEBP = buildWebp();
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16, 1)]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

// every refusal names its rule and carries a measured detail
const expectRefused = (rawBase64, code, detail) => {
  try {
    normalizeWidgetImage(rawBase64);
    throw new Error('should have thrown');
  } catch (e) {
    expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
    expect(e.message).to.equal(code);
    expect(e.details)
      .to.be.a('string')
      .and.not.equal('');
    if (detail) {
      expect(e.details).to.include(detail);
    }
  }
};
const expectDimensionsRefused = (rawBase64, detail) =>
  expectRefused(rawBase64, WIDGET_IMAGE_ERRORS.DIMENSIONS_EXCEEDED, detail);

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

    it('should read the pixel size of every format and refuse images beyond the dimension bound', () => {
      const max = MAX_WIDGET_IMAGE_DIMENSION;
      expect(normalizeWidgetImage(buildPng(max, max).toString('base64'))).to.be.a('string');
      expect(normalizeWidgetImage(buildJpeg(max, 1).toString('base64'))).to.be.a('string');
      expect(normalizeWidgetImage(buildWebpLossless(max, max).toString('base64'))).to.be.a('string');
      expect(normalizeWidgetImage(buildWebpExtended(1, max).toString('base64'))).to.be.a('string');
      expectDimensionsRefused(buildPng(max + 1, 1).toString('base64'), `${max + 1}×1 px, at most ${max}×${max}`);
      expectDimensionsRefused(buildPng(1, max + 1).toString('base64'));
      expectDimensionsRefused(buildJpeg(max + 1, 16).toString('base64'));
      expectDimensionsRefused(buildWebp(max + 1, 16).toString('base64'));
      expectDimensionsRefused(buildWebpLossless(16, max + 1).toString('base64'));
      expectDimensionsRefused(buildWebpExtended(max + 1, 16).toString('base64'));
      expectDimensionsRefused(buildPng(0, 16).toString('base64'));
    });

    it('should fail closed on a header it cannot read', () => {
      // a PNG signature with no IHDR chunk
      expectDimensionsRefused(
        Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16, 1)]).toString(
          'base64',
        ),
        'unreadable image/png header',
      );
      // a JPEG whose scan starts before any frame header, one with a bad
      // marker byte, one that ends before any header
      const app0 = JPEG.slice(2, 20);
      expectDimensionsRefused(
        Buffer.concat([Buffer.from([0xff, 0xd8]), app0, Buffer.from([0xff, 0xda, 0, 4, 1, 1])]).toString('base64'),
      );
      // a first segment followed by a byte that is not a marker
      expectDimensionsRefused(
        Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0, 0x00]), Buffer.alloc(16, 1)]).toString(
          'base64',
        ),
      );
      // a scan marker right after the start of image
      expectDimensionsRefused(
        Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xda, 0, 4, 1, 1]), Buffer.alloc(16, 1)]).toString('base64'),
      );
      expectDimensionsRefused(Buffer.concat([Buffer.from([0xff, 0xd8]), app0]).toString('base64'));
      // padding bytes and standalone markers are walked over
      const padded = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xff, 0xd0]), JPEG.slice(2)]);
      expect(normalizeWidgetImage(padded.toString('base64'))).to.be.a('string');
      // a WebP with an unknown first chunk, a lossy one without its start
      // code, a lossless one without its signature, a truncated one
      const unknownChunk = buildWebp();
      unknownChunk.write('ALPH', 12, 'ascii');
      expectDimensionsRefused(unknownChunk.toString('base64'));
      const noStartCode = buildWebp();
      noStartCode[23] = 0;
      expectDimensionsRefused(noStartCode.toString('base64'));
      const noSignature = buildWebpLossless();
      noSignature[20] = 0;
      expectDimensionsRefused(noSignature.toString('base64'));
      expectDimensionsRefused(
        buildWebp()
          .slice(0, 20)
          .toString('base64'),
      );
    });

    it('should refuse GIF, SVG, empty, non-string and oversized images, each with its own code', () => {
      expectRefused(GIF.toString('base64'), WIDGET_IMAGE_ERRORS.UNSUPPORTED_FORMAT, 'not a PNG, JPEG or WebP');
      expectRefused(SVG.toString('base64'), WIDGET_IMAGE_ERRORS.UNSUPPORTED_FORMAT);
      expectRefused('', WIDGET_IMAGE_ERRORS.INVALID, 'no image bytes');
      expectRefused(42, WIDGET_IMAGE_ERRORS.INVALID);
      expectRefused(undefined, WIDGET_IMAGE_ERRORS.INVALID);
      expectRefused('!!!!', WIDGET_IMAGE_ERRORS.INVALID, 'not valid base64');
      // twice the cap: refused on the base64 length, before any decode
      const big = Buffer.concat([PNG, Buffer.alloc(MAX_WIDGET_IMAGE_BYTES, 1)]);
      expectRefused(big.toString('base64'), WIDGET_IMAGE_ERRORS.TOO_LARGE, 'at least 301 KB received, 300 KB allowed');
      // one byte over, once decoded: the measured size against the bound
      const justOver = Buffer.concat([PNG, Buffer.alloc(MAX_WIDGET_IMAGE_BYTES - PNG.length + 1, 1)]);
      expectRefused(justOver.toString('base64'), WIDGET_IMAGE_ERRORS.TOO_LARGE, '301 KB received, 300 KB allowed');
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

    it('should translate command failures and refused bytes into 400 REQUEST_TO_THIRD_PARTY_FAILED', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      declareImages(externalIntegration, service, ['poster-1']);
      const warn = sinon.stub(logger, 'warn');
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: GIF.toString('base64') } });
      const refused = await externalIntegration.getWidgetImage(service.selector, 'poster-1').catch((e) => e);
      expect(refused).to.be.instanceOf(Error400);
      expect(refused.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      // the reason reaches the developer twice: the response and the server log
      expect(refused.error).to.equal(
        `${WIDGET_IMAGE_ERRORS.UNSUPPORTED_FORMAT}: not a PNG, JPEG or WebP (magic numbers)`,
      );
      sinonAssert.calledOnceWithExactly(
        warn,
        `Widget image ${service.selector}/poster-1 refused: ${WIDGET_IMAGE_ERRORS.UNSUPPORTED_FORMAT} (not a PNG, JPEG or WebP (magic numbers))`,
      );
      const tooLarge = Buffer.concat([PNG, Buffer.alloc(MAX_WIDGET_IMAGE_BYTES - PNG.length + 1, 1)]);
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: tooLarge.toString('base64') } });
      const large = await externalIntegration.getWidgetImage(service.selector, 'poster-1').catch((e) => e);
      expect(large.error).to.include('EXTERNAL_INTEGRATION_WIDGET_IMAGE_TOO_LARGE: 301 KB received, 300 KB allowed');
      // a command failure is not an image refusal: no image log, no detail echoed
      externalIntegration.sendCommand = fake.rejects(
        new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT'),
      );
      const timeout = await externalIntegration.getWidgetImage(service.selector, 'poster-1').catch((e) => e);
      expect(timeout).to.be.instanceOf(Error400);
      expect(timeout.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      expect(timeout.error).to.equal(undefined);
      expect(warn.callCount).to.equal(2);
      expect(externalIntegration.widgetImageCache.get(service.id).size).to.equal(0);
      expect(externalIntegration.widgetImageSlots.get(service.id).active).to.equal(0);
    });

    it('should not cache an image pulled before a lifecycle clear, and pull again after it', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWidgetService();
      declareImages(externalIntegration, service, ['cleaning-map']);
      const pending = [];
      externalIntegration.sendCommand = fake(
        () =>
          new Promise((resolve) => {
            pending.push(resolve);
          }),
      );
      const before = externalIntegration.getWidgetImage(service.selector, 'cleaning-map');
      await waitForCalls(externalIntegration.sendCommand, 1);
      // the integration restarts: caches, in-flight commands and generations move
      externalIntegration.clearWidgetCaches(service);
      declareImages(externalIntegration, service, ['cleaning-map']);
      const after = externalIntegration.getWidgetImage(service.selector, 'cleaning-map');
      await waitForCalls(externalIntegration.sendCommand, 2);
      expect(externalIntegration.sendCommand.callCount).to.equal(2);
      pending[0]({ success: true, data: { image: PNG.toString('base64') } });
      expect(await before).to.equal(`data:image/png;base64,${PNG.toString('base64')}`);
      // the pre-clear map was served to its caller, never cached
      expect((externalIntegration.widgetImageCache.get(service.id) || new Map()).size).to.equal(0);
      pending[1]({ success: true, data: { image: WEBP.toString('base64') } });
      expect(await after).to.equal(`data:image/webp;base64,${WEBP.toString('base64')}`);
      expect(externalIntegration.widgetImageCache.get(service.id).get('cleaning-map').image).to.include('image/webp');
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
