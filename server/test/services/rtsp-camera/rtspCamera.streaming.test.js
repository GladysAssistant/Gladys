const { expect, assert } = require('chai');
const fse = require('fs-extra');
const path = require('path');
const { fake, assert: fakeAssert } = require('sinon');
const FfmpegMock = require('./FfmpegMock.test');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');

const device = {
  id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
  selector: 'my-camera',
  params: [
    {
      name: 'CAMERA_URL',
      value: 'test',
    },
    {
      name: 'CAMERA_ROTATION',
      value: '0',
    },
  ],
};

const gladys = {
  config: {
    tempFolder: '/tmp/gladys',
  },
  device: {
    camera: {
      setImage: fake.resolves(null),
    },
    getBySelector: fake.resolves(device),
  },
};

const childProcessMock = {
  spawn: (command, args, options) => {
    const writeFile = () => {
      fse.writeFileSync(args[args.length - 1], 'hello');
    };
    setTimeout(writeFile, 100);
    return {
      kill: fake.returns(null),
      stdout: {
        on: fake.returns(null),
      },
      stderr: {
        on: fake.returns(null),
      },
      on: fake.returns(null),
    };
  },
};

describe('Camera.streaming', () => {
  const rtspCameraManager = new RtspCameraManager(
    gladys,
    FfmpegMock,
    childProcessMock,
    'de051f90-f34a-4fd5-be2e-e502339ec9bc',
  );
  before(async () => {
    await fse.ensureDir(gladys.config.tempFolder);
  });
  it('should start, ping & stop streaming', async () => {
    const liveStreamingProcess = await rtspCameraManager.startStreaming('my-camera', false, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManager.liveActivePing('my-camera');
    await rtspCameraManager.stopStreaming('my-camera');
  });
  it('should start, ping, verify for last ping and stop streaming', async () => {
    await rtspCameraManager.startStreaming('my-camera', false, 1);
    await rtspCameraManager.liveActivePing('my-camera');
    const liveStream = rtspCameraManager.liveStreams.get('my-camera');
    rtspCameraManager.liveStreams.set('my-camera', { ...liveStream, lastPing: Date.now() - 120 * 1000 });
    await rtspCameraManager.checkIfLiveActive();
    expect(rtspCameraManager.liveStreams.size).to.equal(0);
  });
  it('should start streaming if not started', async () => {
    const [liveStreamingProcess1, liveStreamingProcess2, liveStreamingProcess3] = await Promise.all([
      rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1),
      rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1),
      rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1),
    ]);
    expect(liveStreamingProcess1).to.have.property('camera_folder');
    expect(liveStreamingProcess1).to.have.property('encryption_key');
    expect(liveStreamingProcess2).to.deep.equal(liveStreamingProcess1);
    expect(liveStreamingProcess3).to.deep.equal(liveStreamingProcess1);
    await rtspCameraManager.stopStreaming('my-camera');
  });
  it('should start streaming only once', async () => {
    const rtspCameraManagerWithFakeStart = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );

    // @ts-ignore
    rtspCameraManagerWithFakeStart.startStreaming = fake.resolves({});
    await Promise.all([
      rtspCameraManagerWithFakeStart.startStreamingIfNotStarted('my-camera', false, 1),
      rtspCameraManagerWithFakeStart.startStreamingIfNotStarted('my-camera', false, 1),
      rtspCameraManagerWithFakeStart.startStreamingIfNotStarted('my-camera', false, 1),
    ]);
    // @ts-ignore
    fakeAssert.calledOnce(rtspCameraManagerWithFakeStart.startStreaming);
  });
  it('should start streaming if not started', async () => {
    const rtspCameraManagerWithFail = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    // @ts-ignore
    rtspCameraManagerWithFail.startStreaming = fake.rejects(new Error('test'));
    const promise = rtspCameraManagerWithFail.startStreamingIfNotStarted('my-camera', false, 1);
    await assert.isRejected(promise, 'test');
    expect(rtspCameraManagerWithFail.liveStreamsStarting.size).to.equal(0);
  });
  it('should stop streaming, but kill is not working', async () => {
    const rtspCameraManagerWithFail = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManagerWithFail.liveStreams.set('my-camera', {
      liveStreamingProcess: {
        kill: fake.rejects('error'),
      },
      watchAbortController: {
        abort: fake.returns(null),
      },
      fullFolderPath: path.join(gladys.config.tempFolder, 'lalalalallalala'),
    });
    await rtspCameraManagerWithFail.stopStreaming('my-camera');
  });
  it('should return not found in stopStreaming', async () => {
    const rtspCameraManagerEmpty = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    const promise = rtspCameraManagerEmpty.stopStreaming('my-camera');
    await assert.isRejected(promise, 'STREAM_NOT_FOUND');
  });
});
