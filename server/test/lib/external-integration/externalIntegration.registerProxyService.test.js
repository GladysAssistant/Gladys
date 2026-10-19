const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');
const {
  buildSupervisor,
  seedExternalService,
  TEST_MANIFEST,
  TEST_COMMUNICATION_MANIFEST,
} = require('./testUtils.test');

describe('externalIntegration.registerProxyService', () => {
  let externalIntegration;
  let stateManager;
  let service;
  let proxyService;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, stateManager } = buildSupervisor());
    externalIntegration.registerProxyService(service);
    proxyService = stateManager.get('service', service.name);
  });

  it('should register the proxy under the service name and id', () => {
    expect(proxyService).to.not.equal(null);
    expect(stateManager.get('serviceById', service.id)).to.equal(proxyService);
  });

  it('should delegate start/stop to the supervisor', async () => {
    externalIntegration.start = fake.resolves(null);
    externalIntegration.stop = fake.resolves(null);
    await proxyService.start();
    sinonAssert.calledWith(externalIntegration.start, service.selector);
    await proxyService.stop();
    sinonAssert.calledWith(externalIntegration.stop, service.selector);
  });

  it('should send a DEVICE_SET_VALUE command on setValue', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    const device = { external_id: 'ext:x:switch', selector: 'switch', params: [], name: 'Switch' };
    const deviceFeature = { external_id: 'ext:x:switch:binary', category: 'switch', type: 'binary' };
    await proxyService.device.setValue(device, deviceFeature, 1);
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_SET_VALUE,
      {
        device: { external_id: 'ext:x:switch', selector: 'switch', params: [] },
        device_feature: { external_id: 'ext:x:switch:binary', category: 'switch', type: 'binary' },
        value: 1,
      },
    );
  });

  it('should send a DEVICE_POLL command on poll', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    const device = { external_id: 'ext:x:switch', selector: 'switch', params: [] };
    await proxyService.device.poll(device);
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_POLL,
      {
        device: { external_id: 'ext:x:switch', selector: 'switch', params: [] },
      },
    );
  });

  it('should relay the device lifecycle notifications', async () => {
    externalIntegration.sendMessage = fake.returns(true);
    const device = { external_id: 'ext:x:switch' };
    await proxyService.device.postCreate(device);
    sinonAssert.calledWith(
      externalIntegration.sendMessage,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_CREATED,
      { device },
    );
    await proxyService.device.postUpdate(device);
    sinonAssert.calledWith(
      externalIntegration.sendMessage,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_UPDATED,
      { device },
    );
    await proxyService.device.postDelete(device);
    sinonAssert.calledWith(
      externalIntegration.sendMessage,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_DELETED,
      { device },
    );
  });

  it('should be idempotent: registering twice replaces the frozen proxy', () => {
    // init() registers every installed integration at boot and update()
    // registers the updated row again: stateManager.setState() merges into the
    // existing Store, so merging into the frozen proxy used to throw
    // "Cannot assign to read only property 'start'" and abort the update
    // before the container was recreated.
    const updatedService = { ...service, version: '2.0.0', manifest: { ...service.manifest, version: '2.0.0' } };
    expect(() => externalIntegration.registerProxyService(updatedService)).to.not.throw();
    const reRegistered = stateManager.get('service', service.name);
    expect(reRegistered).to.not.equal(proxyService);
    expect(stateManager.get('serviceById', service.id)).to.equal(reRegistered);
  });

  it('should close the re-registered proxy over the updated service row', async () => {
    const updatedService = { ...service, version: '2.0.0', manifest: { ...service.manifest, version: '2.0.0' } };
    externalIntegration.registerProxyService(updatedService);
    externalIntegration.sendMessage = fake.returns(true);
    const device = { external_id: 'ext:x:switch' };
    await stateManager.get('service', service.name).device.postCreate(device);
    expect(externalIntegration.sendMessage.firstCall.args[0].version).to.equal('2.0.0');
  });

  describe('music capability (capabilities/music.md)', () => {
    const TRACK = {
      id: 'spotify:track:1',
      type: 'track',
      title: 'Blue in Green',
      artwork_key: 'art-1',
      playable: true,
    };
    const device = { external_id: 'ext:x:kitchen', selector: 'kitchen-speaker', params: [], features: [] };
    const devicePayload = { external_id: 'ext:x:kitchen', selector: 'kitchen-speaker', params: [] };

    const registerMusic = (music) => {
      const musicService = { ...service, manifest: { ...TEST_MANIFEST, music } };
      externalIntegration.registerProxyService(musicService);
      return { musicService, proxy: stateManager.get('service', service.name) };
    };

    it('should expose the capability on device integrations only, answering the manifest declaration', () => {
      expect(proxyService.music).to.be.an('object');
      expect(proxyService.music.getCapabilities()).to.deep.equal({
        browse: false,
        search: false,
        queue: false,
        append: false,
      });
      const { proxy } = registerMusic({ browse: true, search: true });
      expect(proxy.music.getCapabilities()).to.deep.equal({ browse: true, search: true, queue: false, append: false });
      externalIntegration.registerProxyService({ ...service, manifest: TEST_COMMUNICATION_MANIFEST });
      expect(stateManager.get('service', service.name).music).to.equal(undefined);
    });

    it('should refuse an undeclared operation without a command', async () => {
      externalIntegration.relayMusicCommand = fake.resolves({});
      await expect(proxyService.music.browse(device, { parentId: null, offset: 0, limit: 50 })).to.be.rejectedWith(
        NotFoundError,
        'MUSIC_OPERATION_NOT_SUPPORTED',
      );
      await expect(proxyService.music.search(device, { query: 'jazz', type: null, limit: 20 })).to.be.rejectedWith(
        NotFoundError,
      );
      await expect(proxyService.music.getQueue(device, { offset: 0, limit: 50 })).to.be.rejectedWith(NotFoundError);
      await expect(proxyService.music.playQueueItem(device, 3)).to.be.rejectedWith(NotFoundError);
      // play with replace needs no declaration, next/append need `append`
      await proxyService.music.play(device, { id: 'x', type: 'track' }, 'replace');
      await expect(proxyService.music.play(device, { id: 'x', type: 'track' }, 'append')).to.be.rejectedWith(
        NotFoundError,
      );
      sinonAssert.calledOnce(externalIntegration.relayMusicCommand);
    });

    it('should relay browse, search and queue, normalize the answers and remember the artwork keys', async () => {
      const { musicService, proxy } = registerMusic({ browse: true, search: true, queue: true, append: true });
      externalIntegration.relayMusicCommand = fake.resolves({
        items: [TRACK, { bad: true }],
        total: 9,
        current_index: 0,
      });
      const browsed = await proxy.music.browse(device, { parentId: 'favorites', offset: 0, limit: 50 });
      expect(browsed).to.deep.equal({
        items: [{ ...TRACK, subtitle: null, duration: null, browsable: false }],
        total: 9,
      });
      sinonAssert.calledWith(
        externalIntegration.relayMusicCommand,
        musicService,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_BROWSE,
        { device: devicePayload, parent_id: 'favorites', offset: 0, limit: 50 },
      );
      const searched = await proxy.music.search(device, { query: 'jazz', type: 'track', limit: 20 });
      expect(searched.items).to.have.lengthOf(1);
      sinonAssert.calledWith(
        externalIntegration.relayMusicCommand,
        musicService,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_SEARCH,
        { device: devicePayload, query: 'jazz', type: 'track', limit: 20 },
      );
      const queue = await proxy.music.getQueue(device, { offset: 0, limit: 50 });
      expect(queue).to.deep.equal({
        items: [{ ...TRACK, subtitle: null, duration: null, browsable: false }],
        current_index: 0,
        total: 9,
      });
      await proxy.music.playQueueItem(device, 3);
      sinonAssert.calledWith(
        externalIntegration.relayMusicCommand,
        musicService,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_QUEUE_PLAY,
        { device: devicePayload, index: 3 },
      );
      await proxy.music.play(device, { id: 'x', type: 'track', title: 'dropped' }, 'append');
      sinonAssert.calledWith(
        externalIntegration.relayMusicCommand,
        musicService,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_PLAY,
        { device: devicePayload, media: { id: 'x', type: 'track' }, mode: 'append' },
      );
      expect(externalIntegration.isMusicArtworkKeyAllowed(musicService, device, 'art-1')).to.equal(true);
      externalIntegration.getMusicArtwork = fake.resolves('data:image/png;base64,x');
      expect(await proxy.music.getArtwork(device, 'art-1')).to.equal('data:image/png;base64,x');
      sinonAssert.calledWith(externalIntegration.getMusicArtwork, musicService, device, 'art-1');
    });
  });
});
