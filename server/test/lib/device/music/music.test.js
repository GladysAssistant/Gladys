const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;
const EventEmitter = require('events');

const StateManager = require('../../../../lib/state');
const Music = require('../../../../lib/device/music');
const { parseBoundedInteger } = require('../../../../lib/device/music/music.getPlayer');
const { NotFoundError, BadParameters } = require('../../../../utils/coreErrors');

const event = new EventEmitter();

const buildMusic = ({ withCapability = true } = {}) => {
  const stateManager = new StateManager(event);
  const device = {
    selector: 'kitchen-speaker',
    external_id: 'ext:sonos:kitchen',
    service: { name: 'ext-sonos' },
    features: [],
  };
  stateManager.setState('device', 'kitchen-speaker', device);
  const capability = {
    getCapabilities: fake.returns({ browse: true, search: true, queue: true, append: true }),
    browse: fake.resolves({ items: [], total: 0 }),
    search: fake.resolves({ items: [] }),
    play: fake.resolves(null),
    getQueue: fake.resolves({ items: [], current_index: null, total: 0 }),
    playQueueItem: fake.resolves(null),
    getArtwork: fake.resolves('data:image/png;base64,x'),
  };
  const services = { 'ext-sonos': withCapability ? { music: capability } : { device: {} } };
  const serviceManager = { getService: (name) => services[name] || null };
  const music = new Music(stateManager, serviceManager);
  return { music, capability, device: stateManager.get('device', 'kitchen-speaker') };
};

describe('device.music', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should resolve a player, 404 on an unknown device or an integration without the capability', () => {
    const { music, capability } = buildMusic();
    expect(music.getPlayer('kitchen-speaker').music).to.equal(capability);
    expect(() => music.getPlayer('nope')).to.throw(NotFoundError, 'Device not found');
    const { music: internal } = buildMusic({ withCapability: false });
    expect(() => internal.getPlayer('kitchen-speaker')).to.throw(NotFoundError, 'MUSIC_NOT_SUPPORTED');
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'orphan', { selector: 'orphan' });
    const orphan = new Music(stateManager, { getService: () => null });
    expect(() => orphan.getPlayer('orphan')).to.throw(NotFoundError, 'MUSIC_NOT_SUPPORTED');
  });

  it('should parse bounded integers from query strings and numbers', () => {
    expect(parseBoundedInteger(undefined, { name: 'limit', min: 1, max: 100, fallback: 50 })).to.equal(50);
    expect(parseBoundedInteger('', { name: 'limit', min: 1, max: 100, fallback: 50 })).to.equal(50);
    expect(parseBoundedInteger('7', { name: 'limit', min: 1, max: 100, fallback: 50 })).to.equal(7);
    expect(parseBoundedInteger(100, { name: 'limit', min: 1, max: 100, fallback: 50 })).to.equal(100);
    expect(parseBoundedInteger(5, { name: 'index', min: 0 })).to.equal(5);
    expect(() => parseBoundedInteger(undefined, { name: 'index', min: 0 })).to.throw(BadParameters, 'index: required');
    expect(() => parseBoundedInteger('101', { name: 'limit', min: 1, max: 100, fallback: 50 })).to.throw(
      BadParameters,
      'limit: must be an integer between 1 and 100',
    );
    expect(() => parseBoundedInteger('0', { name: 'limit', min: 1, max: 100, fallback: 50 })).to.throw(BadParameters);
    expect(() => parseBoundedInteger('1.5', { name: 'offset', min: 0, fallback: 0 })).to.throw(BadParameters);
    expect(() => parseBoundedInteger('abc', { name: 'offset', min: 0, fallback: 0 })).to.throw(
      BadParameters,
      'offset: must be an integer between 0 and infinity',
    );
  });

  it('should answer the capabilities of the player', () => {
    const { music } = buildMusic();
    expect(music.getCapabilities('kitchen-speaker')).to.deep.equal({
      browse: true,
      search: true,
      queue: true,
      append: true,
    });
  });

  it('should browse with the defaults, the root without parent_id, and bound the parameters', async () => {
    const { music, capability, device } = buildMusic();
    await music.browse('kitchen-speaker');
    sinonAssert.calledWith(capability.browse, device, { parentId: null, offset: 0, limit: 50 });
    await music.browse('kitchen-speaker', { parent_id: 'favorites', offset: '10', limit: '100' });
    sinonAssert.calledWith(capability.browse, device, { parentId: 'favorites', offset: 10, limit: 100 });
    await music.browse('kitchen-speaker', { parent_id: '' });
    sinonAssert.calledWith(capability.browse, device, { parentId: null, offset: 0, limit: 50 });
    await expect(music.browse('kitchen-speaker', { parent_id: 'x'.repeat(513) })).to.be.rejectedWith(
      BadParameters,
      'parent_id',
    );
    await expect(music.browse('kitchen-speaker', { parent_id: ['a'] })).to.be.rejectedWith(BadParameters);
    await expect(music.browse('kitchen-speaker', { limit: '101' })).to.be.rejectedWith(BadParameters, 'limit');
    await expect(music.browse('kitchen-speaker', { offset: '-1' })).to.be.rejectedWith(BadParameters, 'offset');
  });

  it('should search with a required query, an optional type and a bounded limit', async () => {
    const { music, capability, device } = buildMusic();
    await music.search('kitchen-speaker', { q: ' jazz ' });
    sinonAssert.calledWith(capability.search, device, { query: 'jazz', type: null, limit: 20 });
    await music.search('kitchen-speaker', { q: 'jazz', type: 'playlist', limit: '50' });
    sinonAssert.calledWith(capability.search, device, { query: 'jazz', type: 'playlist', limit: 50 });
    await music.search('kitchen-speaker', { q: 'jazz', type: '' });
    sinonAssert.calledWith(capability.search, device, { query: 'jazz', type: null, limit: 20 });
    await expect(music.search('kitchen-speaker')).to.be.rejectedWith(BadParameters, 'q:');
    await expect(music.search('kitchen-speaker', { q: '   ' })).to.be.rejectedWith(BadParameters, 'q:');
    await expect(music.search('kitchen-speaker', { q: 'x'.repeat(201) })).to.be.rejectedWith(BadParameters, 'q:');
    await expect(music.search('kitchen-speaker', { q: 'jazz', type: 'podcast' })).to.be.rejectedWith(
      BadParameters,
      'type:',
    );
    await expect(music.search('kitchen-speaker', { q: 'jazz', limit: '51' })).to.be.rejectedWith(BadParameters);
  });

  it('should play a media reference with the replace default and refuse malformed ones', async () => {
    const { music, capability, device } = buildMusic();
    await music.play('kitchen-speaker', { id: 'spotify:track:1', type: 'track', title: 'dropped' });
    sinonAssert.calledWith(capability.play, device, { id: 'spotify:track:1', type: 'track' }, 'replace');
    await music.play('kitchen-speaker', { id: 'spotify:track:1', type: 'track' }, 'append');
    sinonAssert.calledWith(capability.play, device, { id: 'spotify:track:1', type: 'track' }, 'append');
    await music.play('kitchen-speaker', { id: 'spotify:track:1', type: 'track' }, null);
    sinonAssert.calledWith(capability.play, device, { id: 'spotify:track:1', type: 'track' }, 'replace');
    await expect(music.play('kitchen-speaker', 'nope')).to.be.rejectedWith(BadParameters, 'media:');
    await expect(music.play('kitchen-speaker', null)).to.be.rejectedWith(BadParameters, 'media:');
    await expect(music.play('kitchen-speaker', [])).to.be.rejectedWith(BadParameters, 'media:');
    await expect(music.play('kitchen-speaker', { type: 'track' })).to.be.rejectedWith(BadParameters, 'media.id');
    await expect(music.play('kitchen-speaker', { id: '', type: 'track' })).to.be.rejectedWith(
      BadParameters,
      'media.id',
    );
    await expect(music.play('kitchen-speaker', { id: 'x'.repeat(513), type: 'track' })).to.be.rejectedWith(
      BadParameters,
      'media.id',
    );
    await expect(music.play('kitchen-speaker', { id: 'x', type: 'podcast' })).to.be.rejectedWith(
      BadParameters,
      'media.type',
    );
    await expect(music.play('kitchen-speaker', { id: 'x', type: 'track' }, 'shuffle')).to.be.rejectedWith(
      BadParameters,
      'mode:',
    );
  });

  it('should read the queue page and jump to an item', async () => {
    const { music, capability, device } = buildMusic();
    await music.getQueue('kitchen-speaker');
    sinonAssert.calledWith(capability.getQueue, device, { offset: 0, limit: 50 });
    await music.getQueue('kitchen-speaker', { offset: '140', limit: '20' });
    sinonAssert.calledWith(capability.getQueue, device, { offset: 140, limit: 20 });
    await expect(music.getQueue('kitchen-speaker', { limit: '0' })).to.be.rejectedWith(BadParameters);
    await music.playQueueItem('kitchen-speaker', '7');
    sinonAssert.calledWith(capability.playQueueItem, device, 7);
    await expect(music.playQueueItem('kitchen-speaker')).to.be.rejectedWith(BadParameters, 'index: required');
    await expect(music.playQueueItem('kitchen-speaker', -1)).to.be.rejectedWith(BadParameters);
  });

  it('should serve the artwork through the integration', async () => {
    const { music, capability, device } = buildMusic();
    expect(await music.getArtwork('kitchen-speaker', 'art-1')).to.equal('data:image/png;base64,x');
    sinonAssert.calledWith(capability.getArtwork, device, 'art-1');
  });
});
