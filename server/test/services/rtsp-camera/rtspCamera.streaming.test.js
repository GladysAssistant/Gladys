// @ts-nocheck
const { expect, assert } = require('chai');
const fse = require('fs-extra');
const path = require('path');
const { fake, assert: fakeAssert } = require('sinon');
const FfmpegMock = require('./FfmpegMock.test');
const RtspCameraManager = require('../../../services/rtsp-camera/lib');
const { NotFoundError } = require('../../../utils/coreErrors');
const { DEVICE_ROTATION } = require('../../../utils/constants');

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
      const filePath = args.find((arg) => arg.endsWith('index.m3u8'));
      if (filePath) {
        fse.writeFileSync(filePath, 'hello');
      }
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
  let rtspCameraManager;
  before(async () => {
    await fse.ensureDir(gladys.config.tempFolder);
  });
  beforeEach(() => {
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
  });
  afterEach(() => {
    // remove interval
    if (rtspCameraManager.checkIfLiveActiveInterval) {
      clearInterval(rtspCameraManager.checkIfLiveActiveInterval);
    }
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
    rtspCameraManager = new RtspCameraManager(
      wrongGladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    const promise = rtspCameraManager.startStreaming('my-camera', false, 1);
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
    const promise2 = rtspCameraManager.startStreaming('my-camera', false, 1);
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
  it('should start, ping & stop streaming (gateway on)', async () => {
    rtspCameraManager.sendCameraFileToGatewayLimited = fake.resolves(null);
    const liveStreamingProcess = await rtspCameraManager.startStreaming('my-camera', true, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManager.liveActivePing('my-camera');
    await rtspCameraManager.stopStreaming('my-camera');
    fakeAssert.called(rtspCameraManager.sendCameraFileToGatewayLimited);
  });
  it('should star with 90 rotation & stop streaming', async () => {
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
              value: DEVICE_ROTATION.DEGREES_90,
            },
          ],
        }),
      },
    };
    rtspCameraManager = new RtspCameraManager(
      gladysDeviceWithRotation,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManager.onNewCameraFile = fake.resolves(null);
    const liveStreamingProcess = await rtspCameraManager.startStreaming('my-camera', false, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManager.liveActivePing('my-camera');
    await rtspCameraManager.stopStreaming('my-camera');
    fakeAssert.called(rtspCameraManager.onNewCameraFile);
  });
  it('should star with 180 rotation & stop streaming', async () => {
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
              value: DEVICE_ROTATION.DEGREES_180,
            },
          ],
        }),
      },
    };
    rtspCameraManager = new RtspCameraManager(
      gladysDeviceWithRotation,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManager.onNewCameraFile = fake.resolves(null);
    const liveStreamingProcess = await rtspCameraManager.startStreaming('my-camera', false, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManager.liveActivePing('my-camera');
    await rtspCameraManager.stopStreaming('my-camera');
    fakeAssert.called(rtspCameraManager.onNewCameraFile);
  });
  it('should star with 270 rotation & stop streaming', async () => {
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
              value: DEVICE_ROTATION.DEGREES_270,
            },
          ],
        }),
      },
    };
    rtspCameraManager = new RtspCameraManager(
      gladysDeviceWithRotation,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManager.onNewCameraFile = fake.resolves(null);
    const liveStreamingProcess = await rtspCameraManager.startStreaming('my-camera', false, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManager.liveActivePing('my-camera');
    await rtspCameraManager.stopStreaming('my-camera');
    fakeAssert.called(rtspCameraManager.onNewCameraFile);
  });
  it('should star with not rotation params & stop streaming after', async () => {
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
          ],
        }),
      },
    };
    rtspCameraManager = new RtspCameraManager(
      gladysDeviceWithRotation,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManager.onNewCameraFile = fake.resolves(null);
    const liveStreamingProcess = await rtspCameraManager.startStreaming('my-camera', false, 1);
    expect(liveStreamingProcess).to.have.property('camera_folder');
    expect(liveStreamingProcess).to.have.property('encryption_key');
    await rtspCameraManager.liveActivePing('my-camera');
    await rtspCameraManager.stopStreaming('my-camera');
    fakeAssert.called(rtspCameraManager.onNewCameraFile);
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
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );

    // @ts-ignore
    rtspCameraManager.startStreaming = fake.resolves({});
    await Promise.all([
      rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1),
      rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1),
      rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1),
    ]);
    // @ts-ignore
    fakeAssert.calledOnce(rtspCameraManager.startStreaming);
  });
  it('should start streaming if not started', async () => {
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    // @ts-ignore
    rtspCameraManager.startStreaming = fake.rejects(new Error('test'));
    const promise = rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1);
    await assert.isRejected(promise, 'test');
    expect(rtspCameraManager.liveStreamsStarting.size).to.equal(0);
  });
  it('should start streaming locally, then convert local stream to online stream during init', async () => {
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    // @ts-ignore
    rtspCameraManager.convertLocalStreamToGateway = fake.resolves(null);
    const promise = rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1);
    const promiseGateway = rtspCameraManager.startStreamingIfNotStarted('my-camera', true, 1);
    await Promise.all([promise, promiseGateway]);
    // @ts-ignore
    fakeAssert.calledOnce(rtspCameraManager.convertLocalStreamToGateway);
  });
  it('should start streaming locally, then convert local stream to online stream after stream started', async () => {
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    // @ts-ignore
    rtspCameraManager.convertLocalStreamToGateway = fake.resolves(null);
    await rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1);
    await rtspCameraManager.startStreamingIfNotStarted('my-camera', true, 1);
    // @ts-ignore
    fakeAssert.calledOnce(rtspCameraManager.convertLocalStreamToGateway);
    await rtspCameraManager.stopStreaming('my-camera');
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
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMockWithCrash,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    const promise = rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1);
    await assert.isRejected(promise, 'Child process exited with code 100');
    expect(rtspCameraManager.liveStreams.size).to.equal(0);
  });
  it('should start streaming and write multiple time the index', async () => {
    const childProcessMockWithCrash = {
      spawn: (command, args, options) => {
        const writeFile = () => {
          const filePath = args.find((arg) => arg.endsWith('index.m3u8'));
          if (filePath) {
            fse.writeFileSync(filePath, 'hello');
            fse.writeFileSync(filePath, 'hello');
          }
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
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMockWithCrash,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    await rtspCameraManager.startStreamingIfNotStarted('my-camera', false, 1);
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
    rtspCameraManager = new RtspCameraManager(
      gladysWithFailClean,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    rtspCameraManager.liveStreams.set('my-camera', {
      isGladysGateway: true,
      liveStreamingProcess: {
        kill: fake.throws('CANNOT KILL!'),
      },
      watchAbortController: {
        abort: fake.returns(null),
      },
      fullFolderPath: path.join(gladys.config.tempFolder, 'lalalalallalala'),
    });
    await rtspCameraManager.stopStreaming('my-camera');
  });
  it('should return even if stream does not exist in stopStreaming', async () => {
    rtspCameraManager = new RtspCameraManager(
      gladys,
      FfmpegMock,
      childProcessMock,
      'de051f90-f34a-4fd5-be2e-e502339ec9bc',
    );
    await rtspCameraManager.stopStreaming('unknown stream');
  });
});
