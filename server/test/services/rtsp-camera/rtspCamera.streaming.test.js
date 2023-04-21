// @ts-nocheck
const { expect, assert } = require('chai');
const fse = require('fs-extra');
const path = require('path');
const { fake, assert: fakeAssert } = require('sinon');
const FfmpegMock = require('./FfmpegMock.test');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');
const { NotFoundError } = require('../../../utils/coreErrors');

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
  gateway: {
    gladysGatewayClient: {
      cameraCleanSession: fake.resolves(null),
    },
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
      fse.writeFileSync(args[20], 'hello');
    };
    setTimeout(writeFile, 10);
    return {
      kill: fake.returns(null),
      stdout: {
        on: (type, cb) => {
          cb('log log log');
        },
      },
      stderr: {
        on: (type, cb) => {
          cb('stderr log log');
        },
      },
      on: (type, cb) => {},
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
  it('should not start, camera url does not exist', async () => {
    const wrongGladys = {
      device: {
        getBySelector: fake.resolves({
          id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
          selector: 'my-camera',
          params: [],
        }),
      },
    };
    const rtspCameraManagerWithoutDevice = new RtspCameraManager(
      wrongGladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    const promise = rtspCameraManagerWithoutDevice.startStreaming('my-camera', false, 1);
    await assert.isRejected(promise, NotFoundError);
    wrongGladys.device.getBySelector = fake.resolves({
      id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
      selector: 'my-camera',
      params: [
        {
          name: 'CAMERA_URL',
          value: '',
        },
      ],
    });
    const promise2 = rtspCameraManagerWithoutDevice.startStreaming('my-camera', false, 1);
    await assert.isRejected(promise2, NotFoundError);
  });
  it('should start, ping & stop streaming', async () => {
    rtspCameraManager.onNewCameraFile = fake.resolves(null);
    const liveStreamingProcess = await rtspCameraManager.startStreaming('my-camera', false, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManager.liveActivePing('my-camera');
    await rtspCameraManager.stopStreaming('my-camera');
    fakeAssert.called(rtspCameraManager.onNewCameraFile);
  });
  it('should star with rotation & stop streaming', async () => {
    const gladysDeviceWithRotation = {
      config: {
        tempFolder: '/tmp/gladys',
      },
      device: {
        getBySelector: fake.resolves({
          id: 'a6fb4cb8-ccc2-4234-a752-b25d1eb5ab6b',
          selector: 'my-camera',
          params: [
            {
              name: 'CAMERA_URL',
              value: 'test',
            },
            {
              name: 'CAMERA_ROTATION',
              value: '1',
            },
          ],
        }),
      },
    };
    const rtspCameraManagerWithRotation = new RtspCameraManager(
      gladysDeviceWithRotation,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManagerWithRotation.onNewCameraFile = fake.resolves(null);
    const liveStreamingProcess = await rtspCameraManagerWithRotation.startStreaming('my-camera', false, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManagerWithRotation.liveActivePing('my-camera');
    await rtspCameraManagerWithRotation.stopStreaming('my-camera');
    fakeAssert.called(rtspCameraManagerWithRotation.onNewCameraFile);
  });
  it('should ping and get 404', async () => {
    const promise = rtspCameraManager.liveActivePing('lalalallala');
    await assert.isRejected(promise, NotFoundError);
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
  it('should start streaming locally, then convert local stream to online stream during init', async () => {
    const rtspCameraManagerConvertToGateway = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    // @ts-ignore
    rtspCameraManagerConvertToGateway.convertLocalStreamToGateway = fake.resolves(null);
    const promise = rtspCameraManagerConvertToGateway.startStreamingIfNotStarted('my-camera', false, 1);
    const promiseGateway = rtspCameraManagerConvertToGateway.startStreamingIfNotStarted('my-camera', true, 1);
    await Promise.all([promise, promiseGateway]);
    // @ts-ignore
    fakeAssert.calledOnce(rtspCameraManagerConvertToGateway.convertLocalStreamToGateway);
  });
  it('should start streaming locally, then convert local stream to online stream after stream started', async () => {
    const rtspCameraManagerConvertToGateway = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    // @ts-ignore
    rtspCameraManagerConvertToGateway.convertLocalStreamToGateway = fake.resolves(null);
    await rtspCameraManagerConvertToGateway.startStreamingIfNotStarted('my-camera', false, 1);
    await rtspCameraManagerConvertToGateway.startStreamingIfNotStarted('my-camera', true, 1);
    // @ts-ignore
    fakeAssert.calledOnce(rtspCameraManagerConvertToGateway.convertLocalStreamToGateway);
    await rtspCameraManagerConvertToGateway.stopStreaming('my-camera');
  });
  it('should start streaming and should crash immediately', async () => {
    const childProcessMockWithCrash = {
      spawn: (command, args, options) => {
        return {
          stdout: {
            on: (type, cb) => {
              cb('log log log');
            },
          },
          stderr: {
            on: (type, cb) => {
              cb('stderr log log');
            },
          },
          on: (type, cb) => {
            // Exit with code 100
            setTimeout(() => cb(100), 5);
          },
        };
      },
    };
    const rtspCameraManagerWithSpawnCrash = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMockWithCrash,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    const promise = rtspCameraManagerWithSpawnCrash.startStreamingIfNotStarted('my-camera', false, 1);
    await assert.isRejected(promise, 'Child process exited with code 100');
    expect(rtspCameraManagerWithSpawnCrash.liveStreams.size).to.equal(0);
  });
  it('should start streaming and write multiple time the index', async () => {
    const childProcessMockWithCrash = {
      spawn: (command, args, options) => {
        const writeFile = () => {
          fse.writeFileSync(args[20], 'hello');
          fse.writeFileSync(args[20], 'hello');
        };
        setTimeout(writeFile, 5);
        return {
          stdout: {
            on: (type, cb) => {
              cb('log log log');
            },
          },
          stderr: {
            on: (type, cb) => {
              cb('stderr log log');
            },
          },
          on: (type, cb) => {},
        };
      },
    };
    const rtspCameraManagerWithSpawnCrash = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMockWithCrash,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    await rtspCameraManagerWithSpawnCrash.startStreamingIfNotStarted('my-camera', false, 1);
  });
  it('should stop streaming, but kill + clean is not working', async () => {
    const gladysWithFailClean = {
      config: {
        tempFolder: '/tmp/gladys',
      },
      gateway: {
        gladysGatewayClient: {
          cameraCleanSession: fake.rejects('CANNOT CLEAN'),
        },
      },
      device: {
        camera: {
          setImage: fake.resolves(null),
        },
        getBySelector: fake.resolves(device),
      },
    };
    const rtspCameraManagerWithFail = new RtspCameraManager(
      gladysWithFailClean,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManagerWithFail.liveStreams.set('my-camera', {
      isGladysGateway: true,
      liveStreamingProcess: {
        kill: fake.throws('CANNOT KILL!'),
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
