const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require('undici');

const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const TEMP_FOLDER = path.join(os.tmpdir(), 'gladys-netatmo-camera-test');
const gladys = { config: { tempFolder: TEMP_FOLDER } };
const serviceId = 'serviceId';

const VPN_ORIGIN = 'https://prodvpn-eu-14.netatmo.net';
const VPN_PATH = '/restricted/10.0.0.1/aaaa/bbbb';
const VPN_URL = `${VPN_ORIGIN}${VPN_PATH}`;
const LOCAL_ORIGIN = 'http://192.168.1.50';

const fakeJpeg = Buffer.from('fake-jpeg-content');
const expectedImage = `image/jpg;base64,${fakeJpeg.toString('base64')}`;

const buildExecFileMock = (failingUrls = [], writeFile = true) =>
  sinon.fake((command, args, options, callback) => {
    const inputUrl = args[1];
    const filePath = args[args.length - 1];
    if (failingUrls.some((url) => inputUrl.startsWith(url))) {
      callback(new Error(`ffmpeg failed on ${inputUrl}`));
      return;
    }
    if (writeFile) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, fakeJpeg);
    }
    callback(null);
  });

describe('Netatmo Get Camera Image', () => {
  let netatmoHandler;
  let mockAgent;
  let vpnMock;
  let localMock;
  let originalDispatcher;
  let deviceNetatmoMock;

  beforeEach(() => {
    sinon.reset();

    // Store the original dispatcher
    originalDispatcher = getGlobalDispatcher();

    // MockAgent setup
    mockAgent = new MockAgent();
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();
    vpnMock = mockAgent.get(VPN_ORIGIN);
    localMock = mockAgent.get(LOCAL_ORIGIN);

    netatmoHandler = new NetatmoHandler(gladys, serviceId, { execFile: buildExecFileMock() });
    deviceNetatmoMock = {
      id: '70:ee:50:aa:bb:cc',
      type: 'NACamera',
      vpn_url: VPN_URL,
      is_local: false,
    };
  });

  afterEach(() => {
    sinon.reset();
    // Clean up the mock agent
    mockAgent.close();
    // Restore the original dispatcher
    setGlobalDispatcher(originalDispatcher);
  });

  it('should return undefined without VPN URL', async () => {
    delete deviceNetatmoMock.vpn_url;

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(undefined);
    sinon.assert.notCalled(netatmoHandler.childProcess.execFile);
  });

  it('should take the snapshot through the VPN URL for a non local camera', async () => {
    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(expectedImage);
    sinon.assert.calledOnce(netatmoHandler.childProcess.execFile);
    const ffmpegArgs = netatmoHandler.childProcess.execFile.firstCall.args[1];
    expect(ffmpegArgs[1]).to.equal(`${VPN_URL}/live/snapshot_720.jpg`);
  });

  it('should resolve, use and cache the local URL for a local camera', async () => {
    deviceNetatmoMock.is_local = true;
    vpnMock.intercept({ method: 'GET', path: `${VPN_PATH}/command/ping` }).reply(200, { local_url: LOCAL_ORIGIN });
    localMock.intercept({ method: 'GET', path: '/command/ping' }).reply(200, { local_url: LOCAL_ORIGIN });

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(expectedImage);
    expect(netatmoHandler.cameraBaseUrls[deviceNetatmoMock.id]).to.equal(LOCAL_ORIGIN);
    expect(netatmoHandler.childProcess.execFile.firstCall.args[1][1]).to.equal(`${LOCAL_ORIGIN}/live/snapshot_720.jpg`);

    // second call: no ping interception left, the cached local URL is used directly
    const secondImage = await netatmoHandler.getCameraImage(deviceNetatmoMock);
    expect(secondImage).to.equal(expectedImage);
  });

  it('should fall back to the VPN URL when the ping returns no local URL', async () => {
    deviceNetatmoMock.is_local = true;
    vpnMock.intercept({ method: 'GET', path: `${VPN_PATH}/command/ping` }).reply(200, {});

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(expectedImage);
    expect(netatmoHandler.cameraBaseUrls[deviceNetatmoMock.id]).to.equal(undefined);
  });

  it('should fall back to the VPN URL when the local URL does not confirm the ping', async () => {
    deviceNetatmoMock.is_local = true;
    vpnMock.intercept({ method: 'GET', path: `${VPN_PATH}/command/ping` }).reply(200, { local_url: LOCAL_ORIGIN });
    localMock.intercept({ method: 'GET', path: '/command/ping' }).reply(200, { local_url: 'http://10.9.9.9' });

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(expectedImage);
    expect(netatmoHandler.cameraBaseUrls[deviceNetatmoMock.id]).to.equal(undefined);
  });

  it('should fall back to the VPN URL when the ping fails', async () => {
    deviceNetatmoMock.is_local = true;
    // no ping interception: the request fails

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(expectedImage);
  });

  it('should invalidate a stale cached local URL and fall back to the VPN URL', async () => {
    deviceNetatmoMock.is_local = true;
    netatmoHandler.cameraBaseUrls[deviceNetatmoMock.id] = LOCAL_ORIGIN;
    netatmoHandler.childProcess = { execFile: buildExecFileMock([LOCAL_ORIGIN]) };

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(expectedImage);
    expect(netatmoHandler.cameraBaseUrls[deviceNetatmoMock.id]).to.equal(undefined);
  });

  it('should return undefined when both local and VPN snapshots fail', async () => {
    deviceNetatmoMock.is_local = true;
    netatmoHandler.cameraBaseUrls[deviceNetatmoMock.id] = LOCAL_ORIGIN;
    netatmoHandler.childProcess = { execFile: buildExecFileMock([LOCAL_ORIGIN, VPN_ORIGIN]) };

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(undefined);
    expect(netatmoHandler.cameraBaseUrls[deviceNetatmoMock.id]).to.equal(undefined);
  });

  it('should return undefined when the snapshot file cannot be read', async () => {
    netatmoHandler.childProcess = { execFile: buildExecFileMock([], false) };

    const image = await netatmoHandler.getCameraImage(deviceNetatmoMock);

    expect(image).to.equal(undefined);
  });
});
