const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const { authenticatedRequest } = require('../request.test');
const { SERVICE_STATUS, SERVICE_TYPES, WEBSOCKET_MESSAGE_TYPES, ERROR_MESSAGES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { buildPng } = require('../../helpers/widgetImages.test');

const PNG = buildPng();

const MUSIC_MANIFEST = {
  manifest_version: 1,
  type: 'device',
  name: 'Sonos Demo',
  description: { en: 'Sonos players demo integration.' },
  version: '1.0.0',
  docker_image: 'ghcr.io/john/gladys-sonos:1.0.0',
  gladys_version: '>=4.62.0',
  music: { browse: true, search: true, queue: true, append: false },
};

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

describe('Music API', () => {
  let gladys;
  let service;
  let player;
  const stubbedProps = [];

  const stubInstance = (object, key, value) => {
    object[key] = value;
    stubbedProps.push([object, key]);
  };

  const connect = () => {
    gladys.externalIntegration.connections.set(service.id, { readyState: 1, send: fake.returns(null) });
  };

  beforeEach(async () => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
    service = (
      await db.Service.create({
        name: 'ext-dev-sonos',
        selector: 'ext-dev-sonos',
        version: '1.0.0',
        status: SERVICE_STATUS.RUNNING,
        type: SERVICE_TYPES.EXTERNAL,
        docker_image: MUSIC_MANIFEST.docker_image,
        manifest: MUSIC_MANIFEST,
        token_version: 1,
      })
    ).get({ plain: true });
    gladys.externalIntegration.registerProxyService(service);
    player = await gladys.device.create({
      name: 'Kitchen speaker',
      external_id: 'ext:ext-dev-sonos:kitchen',
      service_id: service.id,
      features: [
        {
          name: 'Artwork',
          external_id: 'ext:ext-dev-sonos:kitchen:artwork',
          category: 'music',
          type: 'artwork',
          read_only: true,
          has_feedback: false,
          keep_history: false,
          min: 0,
          max: 0,
          last_value_string: 'art-now',
        },
      ],
    });
  });

  afterEach(() => {
    stubbedProps.forEach(([object, key]) => {
      delete object[key];
    });
    stubbedProps.length = 0;
    gladys.externalIntegration.connections.delete(service.id);
    gladys.stateManager.deleteState('service', service.name);
    gladys.stateManager.deleteState('serviceById', service.id);
    gladys.stateManager.deleteState('device', player.selector);
    [
      'widgetImageCache',
      'widgetImageInFlight',
      'widgetImageSlots',
      'musicArtworkKeys',
      'musicCommandsInFlight',
    ].forEach((state) => gladys.externalIntegration[state].clear());
    sinon.restore();
  });

  describe('GET /api/v1/device/:device_selector/music/capabilities', () => {
    it('should answer the manifest declaration whatever the state of the container', async () => {
      const res = await authenticatedRequest
        .get(`/api/v1/device/${player.selector}/music/capabilities`)
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.deep.equal({ browse: true, search: true, queue: true, append: false });
    });

    it('should 404 on an unknown device', async () => {
      const res = await authenticatedRequest.get('/api/v1/device/nope/music/capabilities').expect(404);
      expect(res.body.message).to.equal('Device not found');
    });

    it('should 404 MUSIC_NOT_SUPPORTED on a device of an internal service', async () => {
      // a device this file owns, on the seed's internal service: the shared seed devices are
      // deleted by other files on the same mocha worker
      const internalPlayer = await gladys.device.create({
        name: 'Internal speaker',
        external_id: 'music-test:internal-speaker',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        features: [],
      });
      const res = await authenticatedRequest
        .get(`/api/v1/device/${internalPlayer.selector}/music/capabilities`)
        .expect(404);
      expect(res.body.message).to.equal('MUSIC_NOT_SUPPORTED');
      gladys.stateManager.deleteState('device', internalPlayer.selector);
    });
  });

  describe('relayed routes', () => {
    it('should 503 on every relayed route while the integration is disconnected', async () => {
      const base = `/api/v1/device/${player.selector}/music`;
      await authenticatedRequest.get(`${base}/browse`).expect(503);
      await authenticatedRequest.get(`${base}/search?q=jazz`).expect(503);
      await authenticatedRequest.get(`${base}/queue`).expect(503);
      await authenticatedRequest
        .post(`${base}/play`)
        .send({ media: { id: 'x', type: 'track' } })
        .expect(503);
      await authenticatedRequest
        .post(`${base}/queue/play`)
        .send({ index: 2 })
        .expect(503);
    });

    it('should relay browse, search, queue and play with normalized answers when connected', async () => {
      connect();
      const sendCommand = fake((target, type) => {
        if (type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_QUEUE_GET) {
          return Promise.resolve({ success: true, data: { items: [TRACK], current_index: 3, total: 42 } });
        }
        if (type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_BROWSE) {
          return Promise.resolve({ success: true, data: { items: [TRACK, { bad: true }], total: 2 } });
        }
        if (type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_SEARCH) {
          return Promise.resolve({ success: true, data: { items: [TRACK] } });
        }
        return Promise.resolve({ success: true });
      });
      stubInstance(gladys.externalIntegration, 'sendCommand', sendCommand);
      const base = `/api/v1/device/${player.selector}/music`;
      const browse = await authenticatedRequest.get(`${base}/browse?parent_id=favorites&limit=10`).expect(200);
      expect(browse.body).to.deep.equal({ items: [TRACK], total: 2 });
      expect(sendCommand.lastCall.args[2]).to.deep.include({ parent_id: 'favorites', offset: 0, limit: 10 });
      const search = await authenticatedRequest.get(`${base}/search?q=jazz&type=track`).expect(200);
      expect(search.body).to.deep.equal({ items: [TRACK] });
      expect(sendCommand.lastCall.args[2]).to.deep.include({ query: 'jazz', type: 'track', limit: 20 });
      const queue = await authenticatedRequest.get(`${base}/queue?offset=140&limit=20`).expect(200);
      expect(queue.body).to.deep.equal({ items: [TRACK], current_index: 3, total: 42 });
      const play = await authenticatedRequest
        .post(`${base}/play`)
        .send({ media: { id: 'spotify:playlist:1', type: 'playlist', title: 'Morning' } })
        .expect(200);
      expect(play.body).to.deep.equal({ success: true });
      expect(sendCommand.lastCall.args[2]).to.deep.include({
        media: { id: 'spotify:playlist:1', type: 'playlist' },
        mode: 'replace',
      });
      await authenticatedRequest
        .post(`${base}/queue/play`)
        .send({ index: 7 })
        .expect(200);
      expect(sendCommand.lastCall.args[1]).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_QUEUE_PLAY);
      expect(sendCommand.lastCall.args[2]).to.deep.include({ index: 7 });
    });

    it('should 400 on invalid parameters and 404 on an undeclared operation, without a command', async () => {
      connect();
      const sendCommand = fake.resolves({ success: true, data: {} });
      stubInstance(gladys.externalIntegration, 'sendCommand', sendCommand);
      const base = `/api/v1/device/${player.selector}/music`;
      await authenticatedRequest.get(`${base}/browse?limit=101`).expect(400);
      await authenticatedRequest.get(`${base}/search`).expect(400);
      await authenticatedRequest.get(`${base}/search?q=jazz&type=podcast`).expect(400);
      await authenticatedRequest.get(`${base}/queue?offset=-1`).expect(400);
      await authenticatedRequest
        .post(`${base}/play`)
        .send({ media: { id: 'x', type: 'track' }, mode: 'shuffle' })
        .expect(400);
      await authenticatedRequest
        .post(`${base}/queue/play`)
        .send({})
        .expect(400);
      // append is not declared by the manifest: the mode is refused, not the player
      const res = await authenticatedRequest
        .post(`${base}/play`)
        .send({ media: { id: 'x', type: 'track' }, mode: 'append' })
        .expect(400);
      expect(res.body.message).to.equal('MUSIC_MODE_NOT_SUPPORTED');
      expect(sendCommand.callCount).to.equal(0);
    });

    it('should translate a refusal, a timeout and a 429 beyond the commands in flight', async () => {
      connect();
      stubInstance(
        gladys.externalIntegration,
        'sendCommand',
        fake.rejects(new ExternalIntegrationUnavailableError('Spotify: token expired')),
      );
      const base = `/api/v1/device/${player.selector}/music`;
      const refused = await authenticatedRequest.get(`${base}/search?q=jazz`).expect(400);
      expect(refused.body.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      expect(refused.body.error).to.equal('Spotify: token expired');
      stubInstance(
        gladys.externalIntegration,
        'sendCommand',
        fake.rejects(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT')),
      );
      await authenticatedRequest.get(`${base}/search?q=jazz`).expect(504);
      gladys.externalIntegration.musicCommandsInFlight.set(service.id, 4);
      await authenticatedRequest.get(`${base}/search?q=jazz`).expect(429);
    });
  });

  describe('GET /api/v1/device/:device_selector/music/artwork/:key', () => {
    it('should serve the current artwork and a key seen in a response, 404 anything else', async () => {
      connect();
      const sendCommand = fake.resolves({ success: true, data: { image: PNG.toString('base64') } });
      stubInstance(gladys.externalIntegration, 'sendCommand', sendCommand);
      const base = `/api/v1/device/${player.selector}/music`;
      await authenticatedRequest.get(`${base}/artwork/art-unknown`).expect(404);
      await authenticatedRequest.get(`${base}/artwork/Bad%20Key`).expect(404);
      expect(sendCommand.callCount).to.equal(0);
      const res = await authenticatedRequest.get(`${base}/artwork/art-now`).expect(200);
      expect(res.body.image).to.equal(`data:image/png;base64,${PNG.toString('base64')}`);
      expect(sendCommand.lastCall.args[1]).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_GET_ARTWORK);
      // the cache hit is served while the integration is stopped
      gladys.externalIntegration.connections.delete(service.id);
      await authenticatedRequest.get(`${base}/artwork/art-now`).expect(200);
      expect(sendCommand.callCount).to.equal(1);
      // a key seen in a response is a miss: 503 while the integration is stopped (the real
      // sendCommand checks the connection), served once it is back
      gladys.externalIntegration.rememberMusicArtworkKeys(service, [TRACK]);
      delete gladys.externalIntegration.sendCommand;
      await authenticatedRequest.get(`${base}/artwork/${TRACK.artwork_key}`).expect(503);
      stubInstance(gladys.externalIntegration, 'sendCommand', sendCommand);
      connect();
      await authenticatedRequest.get(`${base}/artwork/${TRACK.artwork_key}`).expect(200);
      expect(sendCommand.callCount).to.equal(2);
    });
  });
});
