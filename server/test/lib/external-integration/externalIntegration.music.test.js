const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const logger = require('../../../utils/logger');
const { WEBSOCKET_MESSAGE_TYPES, ERROR_MESSAGES } = require('../../../utils/constants');
const { Error400, Error503, Error504 } = require('../../../utils/httpErrors');
const { NotFoundError, TooManyRequests, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const {
  MUSIC_COMMAND_TIMEOUT_MS,
  MAX_MUSIC_COMMANDS_IN_FLIGHT,
  MAX_MUSIC_ITEMS_PER_RESPONSE,
  MAX_MUSIC_ARTWORK_KEYS_PER_INTEGRATION,
  WIDGET_GET_TIMEOUT_MS,
} = require('../../../lib/external-integration/constants');
const {
  normalizeMediaItem,
  normalizeMediaItems,
  normalizeBrowseResult,
  normalizeSearchResult,
  normalizeQueueResult,
} = require('../../../lib/external-integration/externalIntegration.normalizeMusic');
const { toMusicHttpError } = require('../../../lib/external-integration/externalIntegration.music');
const { WIDGET_IMAGE_ERRORS } = require('../../../lib/external-integration/externalIntegration.normalizeWidgetImage');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');
const { buildPng, buildWebp } = require('../../helpers/widgetImages.test');

const PNG = buildPng();
const WEBP = buildWebp();

const TRACK = {
  id: 'spotify:track:1',
  type: 'track',
  title: 'Blue in Green',
  subtitle: 'Miles Davis',
  duration: 337,
  artwork_key: 'art-3f9a2c1b7e4d',
  browsable: false,
  playable: true,
};

const MUSIC_MANIFEST = { ...TEST_MANIFEST, music: { browse: true, search: true, queue: true, append: false } };

const seedMusicService = (overrides = {}) => seedExternalService({ manifest: MUSIC_MANIFEST, ...overrides });

const player = (artworkKey = null) => ({
  external_id: 'ext:ext-dev-open-meteo-demo:kitchen',
  selector: 'kitchen-speaker',
  params: [],
  features: [{ category: 'music', type: 'artwork', last_value_string: artworkKey }],
});

const waitForCalls = async (commandFake, count) => {
  // eslint-disable-next-line no-restricted-syntax
  for (let attempt = 0; attempt < 200 && commandFake.callCount < count; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }
};

describe('externalIntegration music', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('normalizeMusic', () => {
    it('should keep the known fields of a MediaItem, bounded', () => {
      expect(normalizeMediaItem({ ...TRACK, extra: 'dropped' })).to.deep.equal(TRACK);
      const long = normalizeMediaItem({
        ...TRACK,
        title: 'x'.repeat(300),
        subtitle: 'y'.repeat(300),
        duration: -1,
        artwork_key: 'Bad Key',
        browsable: 'yes',
        playable: 1,
      });
      expect(long.title).to.equal('x'.repeat(200));
      expect(long.subtitle).to.equal('y'.repeat(200));
      expect(long.duration).to.equal(null);
      expect(long.artwork_key).to.equal(null);
      expect(long.browsable).to.equal(false);
      expect(long.playable).to.equal(false);
      expect(normalizeMediaItem({ id: 'folder', type: 'folder', title: 'Favorites' })).to.deep.equal({
        id: 'folder',
        type: 'folder',
        title: 'Favorites',
        subtitle: null,
        duration: null,
        artwork_key: null,
        browsable: false,
        playable: false,
      });
    });

    it('should drop an item without id or title, with an unknown type, or that is not an object', () => {
      expect(normalizeMediaItem(null)).to.equal(null);
      expect(normalizeMediaItem([TRACK])).to.equal(null);
      expect(normalizeMediaItem({ ...TRACK, id: undefined })).to.equal(null);
      expect(normalizeMediaItem({ ...TRACK, id: '' })).to.equal(null);
      expect(normalizeMediaItem({ ...TRACK, id: 'x'.repeat(513) })).to.equal(null);
      expect(normalizeMediaItem({ ...TRACK, title: '' })).to.equal(null);
      expect(normalizeMediaItem({ ...TRACK, title: 12 })).to.equal(null);
      expect(normalizeMediaItem({ ...TRACK, type: 'podcast' })).to.equal(null);
    });

    it('should drop invalid items with a warning and cap the list', () => {
      const warn = sinon.stub(logger, 'warn');
      expect(normalizeMediaItems('nope', 'ext/browse')).to.deep.equal([]);
      const items = normalizeMediaItems([TRACK, { bad: true }, null], 'ext/browse');
      expect(items).to.have.lengthOf(1);
      sinonAssert.calledWithMatch(warn, 'Music ext/browse: 2 invalid media item(s) dropped');
      const many = new Array(MAX_MUSIC_ITEMS_PER_RESPONSE + 20).fill(TRACK);
      expect(normalizeMediaItems(many, 'ext/browse')).to.have.lengthOf(MAX_MUSIC_ITEMS_PER_RESPONSE);
    });

    it('should normalize browse, search and queue answers with bounded counts', () => {
      expect(normalizeBrowseResult({ items: [TRACK], total: 42 }, 'ext')).to.deep.equal({ items: [TRACK], total: 42 });
      expect(normalizeBrowseResult({ items: [TRACK], total: -3 }, 'ext').total).to.equal(1);
      expect(normalizeBrowseResult(null, 'ext')).to.deep.equal({ items: [], total: 0 });
      expect(normalizeSearchResult({ items: [TRACK, TRACK] }, 'ext').items).to.have.lengthOf(2);
      expect(normalizeSearchResult('nope', 'ext')).to.deep.equal({ items: [] });
      expect(normalizeQueueResult({ items: [TRACK], current_index: 7, total: 42 }, 'ext')).to.deep.equal({
        items: [TRACK],
        current_index: 7,
        total: 42,
      });
      // an index outside the queue, or missing, is "nothing plays"
      expect(normalizeQueueResult({ items: [TRACK], current_index: 42, total: 42 }, 'ext').current_index).to.equal(
        null,
      );
      expect(normalizeQueueResult({ items: [TRACK] }, 'ext')).to.deep.equal({
        items: [TRACK],
        current_index: null,
        total: 1,
      });
      expect(normalizeQueueResult(undefined, 'ext')).to.deep.equal({ items: [], current_index: null, total: 0 });
    });
  });

  describe('toMusicHttpError', () => {
    it('should map the command failures to 503, 504 and 400, and leave other errors untouched', () => {
      expect(
        toMusicHttpError(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_NOT_CONNECTED')),
      ).to.be.instanceOf(Error503);
      expect(
        toMusicHttpError(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT')),
      ).to.be.instanceOf(Error504);
      const failed = toMusicHttpError(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_FAILED'));
      expect(failed).to.be.instanceOf(Error400);
      expect(failed.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      expect(failed.error).to.equal(undefined);
      const refused = toMusicHttpError(new ExternalIntegrationUnavailableError('Spotify: token expired'));
      expect(refused.error).to.equal('Spotify: token expired');
      const imageError = new ExternalIntegrationUnavailableError(WIDGET_IMAGE_ERRORS.TOO_LARGE);
      imageError.details = '378 KB received, 300 KB allowed';
      expect(toMusicHttpError(imageError).error).to.equal(
        `${WIDGET_IMAGE_ERRORS.TOO_LARGE}: 378 KB received, 300 KB allowed`,
      );
      const other = new NotFoundError('nope');
      expect(toMusicHttpError(other)).to.equal(other);
    });
  });

  describe('relayMusicCommand', () => {
    it('should relay with the 10 s ack, return the data and translate failures', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedMusicService();
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { items: [] } });
      const data = await externalIntegration.relayMusicCommand(
        service,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_SEARCH,
        { query: 'jazz' },
      );
      expect(data).to.deep.equal({ items: [] });
      sinonAssert.calledOnceWithExactly(
        externalIntegration.sendCommand,
        service,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_SEARCH,
        { query: 'jazz' },
        { timeoutMs: MUSIC_COMMAND_TIMEOUT_MS },
      );
      expect(externalIntegration.musicCommandsInFlight.get(service.id)).to.equal(0);
      externalIntegration.sendCommand = fake.resolves({ success: true });
      expect(await externalIntegration.relayMusicCommand(service, 'x', {})).to.deep.equal({});
      externalIntegration.sendCommand = fake.rejects(
        new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_NOT_CONNECTED'),
      );
      await expect(externalIntegration.relayMusicCommand(service, 'x', {})).to.be.rejectedWith(Error503);
      expect(externalIntegration.musicCommandsInFlight.get(service.id)).to.equal(0);
    });

    it('should fail at once with 429 beyond the commands in flight, never queueing', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedMusicService();
      const pending = [];
      externalIntegration.sendCommand = fake(
        () =>
          new Promise((resolve) => {
            pending.push(resolve);
          }),
      );
      const inFlight = new Array(MAX_MUSIC_COMMANDS_IN_FLIGHT)
        .fill(null)
        .map(() => externalIntegration.relayMusicCommand(service, 'x', {}));
      await waitForCalls(externalIntegration.sendCommand, MAX_MUSIC_COMMANDS_IN_FLIGHT);
      await expect(externalIntegration.relayMusicCommand(service, 'x', {})).to.be.rejectedWith(TooManyRequests);
      expect(externalIntegration.sendCommand.callCount).to.equal(MAX_MUSIC_COMMANDS_IN_FLIGHT);
      pending.forEach((resolve) => resolve({ success: true, data: {} }));
      await Promise.all(inFlight);
      expect(externalIntegration.musicCommandsInFlight.get(service.id)).to.equal(0);
    });
  });

  describe('artwork allowlist', () => {
    it('should allow the current artwork state and the keys of recent responses, bounded in LRU order', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedMusicService();
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, player('art-now'), 'art-now')).to.equal(true);
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, player('art-now'), 'art-other')).to.equal(false);
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, { features: undefined }, 'art-now')).to.equal(false);
      externalIntegration.rememberMusicArtworkKeys(service, [
        { artwork_key: 'art-a' },
        { artwork_key: null },
        { artwork_key: 'art-b' },
      ]);
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, player(), 'art-a')).to.equal(true);
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, player(), 'art-b')).to.equal(true);
      // an expired key is no longer served
      externalIntegration.musicArtworkKeys.get(service.id).set('art-a', Date.now() - 1);
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, player(), 'art-a')).to.equal(false);
      // the allowlist is bounded: the oldest keys leave first
      const many = new Array(MAX_MUSIC_ARTWORK_KEYS_PER_INTEGRATION).fill(null).map((_, index) => ({
        artwork_key: `art-${index}`,
      }));
      externalIntegration.rememberMusicArtworkKeys(service, many);
      expect(externalIntegration.musicArtworkKeys.get(service.id).size).to.equal(
        MAX_MUSIC_ARTWORK_KEYS_PER_INTEGRATION,
      );
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, player(), 'art-b')).to.equal(false);
      expect(externalIntegration.isMusicArtworkKeyAllowed(service, player(), 'art-999')).to.equal(true);
      // a lifecycle clear drops the allowlist and the command counters
      externalIntegration.musicCommandsInFlight.set(service.id, 2);
      externalIntegration.clearWidgetCaches(service);
      expect(externalIntegration.musicArtworkKeys.has(service.id)).to.equal(false);
      expect(externalIntegration.musicCommandsInFlight.has(service.id)).to.equal(false);
    });
  });

  describe('getMusicArtwork', () => {
    it('should 404 on a malformed or unallowed key without sending anything', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedMusicService();
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: PNG.toString('base64') } });
      await expect(externalIntegration.getMusicArtwork(service, player(), 'Bad Key')).to.be.rejectedWith(NotFoundError);
      await expect(externalIntegration.getMusicArtwork(service, player(), 12)).to.be.rejectedWith(NotFoundError);
      await expect(externalIntegration.getMusicArtwork(service, player(), 'art-unknown')).to.be.rejectedWith(
        NotFoundError,
        'MUSIC_ARTWORK_NOT_FOUND',
      );
      sinonAssert.notCalled(externalIntegration.sendCommand);
    });

    it('should pull an allowed key over music.get-artwork, validate and cache it an hour', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedMusicService();
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: WEBP.toString('base64') } });
      const image = await externalIntegration.getMusicArtwork(service, player('art-now'), 'art-now');
      sinonAssert.calledOnceWithExactly(
        externalIntegration.sendCommand,
        service,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_GET_ARTWORK,
        { key: 'art-now' },
        { timeoutMs: WIDGET_GET_TIMEOUT_MS },
      );
      expect(image).to.equal(`data:image/webp;base64,${WEBP.toString('base64')}`);
      // a cache hit is served whatever the state of the container
      externalIntegration.sendCommand = fake.rejects(
        new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_NOT_CONNECTED'),
      );
      expect(await externalIntegration.getMusicArtwork(service, player('art-now'), 'art-now')).to.equal(image);
      sinonAssert.notCalled(externalIntegration.sendCommand);
      const entry = externalIntegration.widgetImageCache.get(service.id).get('art-now');
      expect(entry.expiresAt).to.be.within(Date.now() + 59 * 60 * 1000, Date.now() + 61 * 60 * 1000);
      // a miss while disconnected is a 503
      entry.expiresAt = Date.now() - 1;
      await expect(externalIntegration.getMusicArtwork(service, player('art-now'), 'art-now')).to.be.rejectedWith(
        Error503,
      );
    });

    it('should refuse invalid bytes with the named rule, logged, and share one command between callers', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedMusicService();
      const warn = sinon.stub(logger, 'warn');
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: 'not-an-image' } });
      const error = await externalIntegration.getMusicArtwork(service, player('art-now'), 'art-now').catch((e) => e);
      expect(error).to.be.instanceOf(Error400);
      expect(error.error).to.include(WIDGET_IMAGE_ERRORS.UNSUPPORTED_FORMAT);
      sinonAssert.calledWithMatch(warn, `Music artwork ${service.selector}/art-now refused`);
      const pending = [];
      externalIntegration.sendCommand = fake(
        () =>
          new Promise((resolve) => {
            pending.push(resolve);
          }),
      );
      const first = externalIntegration.getMusicArtwork(service, player('art-now'), 'art-now');
      const second = externalIntegration.getMusicArtwork(service, player('art-now'), 'art-now');
      await waitForCalls(externalIntegration.sendCommand, 1);
      expect(externalIntegration.sendCommand.callCount).to.equal(1);
      pending[0]({ success: true, data: { image: PNG.toString('base64') } });
      expect(await first).to.equal(await second);
    });

    it('should not cache an artwork pulled before a lifecycle clear', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedMusicService();
      const pending = [];
      externalIntegration.sendCommand = fake(
        () =>
          new Promise((resolve) => {
            pending.push(resolve);
          }),
      );
      const before = externalIntegration.getMusicArtwork(service, player('art-now'), 'art-now');
      await waitForCalls(externalIntegration.sendCommand, 1);
      externalIntegration.clearWidgetCaches(service);
      pending[0]({ success: true, data: { image: PNG.toString('base64') } });
      expect(await before).to.equal(`data:image/png;base64,${PNG.toString('base64')}`);
      expect((externalIntegration.widgetImageCache.get(service.id) || new Map()).size).to.equal(0);
    });
  });
});
