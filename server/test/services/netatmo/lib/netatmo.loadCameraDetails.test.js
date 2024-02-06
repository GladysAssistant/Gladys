const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const bodyGetCameraMock = require('../netatmo.getCamera.mock.test.json');
const camerasDetailsMock = require('../netatmo.loadCameraDetails.mock.test.json');
const { FfmpegMock, childProcessMock } = require('../FfmpegMock.test');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  stateManager: {
    get: sinon.stub().resolves(),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, FfmpegMock, childProcessMock, serviceId);
const accessToken = 'testAccessToken';

describe('Netatmo Load Camera Details', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.accessToken = accessToken;
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should load cameras details successfully', async () => {
    const bodyGetCameraMockFake = JSON.parse(JSON.stringify(bodyGetCameraMock));
    const { cameras: camerasFake, ...homeWithoutCameras } = bodyGetCameraMockFake.homes[1];
    bodyGetCameraMockFake.homes[1] = homeWithoutCameras;
    nock('https://api.netatmo.com')
      .get('/api/gethomedata')
      .reply(200, { body: bodyGetCameraMockFake, status: 'ok' });

    const { cameras, modules } = await netatmoHandler.loadCameraDetails();

    expect(cameras).to.deep.eq(camerasDetailsMock.cameras);
    expect(modules).to.deep.eq(camerasDetailsMock.modules);
    expect(cameras).to.be.an('array');
    expect(modules).to.be.an('array');
  });

  it('should not load any camera details successfully', async () => {
    const bodyGetCameraMockFake = JSON.parse(JSON.stringify(bodyGetCameraMock));
    const { cameras: cameras0Fake, ...home0WithoutCameras } = bodyGetCameraMockFake.homes[0];
    const { cameras: cameras1Fake, ...home1WithoutCameras } = bodyGetCameraMockFake.homes[1];
    bodyGetCameraMockFake.homes[0] = home0WithoutCameras;
    bodyGetCameraMockFake.homes[1] = home1WithoutCameras;
    nock('https://api.netatmo.com')
      .get('/api/gethomedata')
      .reply(200, { body: bodyGetCameraMockFake, status: 'ok' });

    const { cameras, modules } = await netatmoHandler.loadCameraDetails();

    expect(cameras).to.deep.eq([]);
    expect(modules).to.deep.eq([]);
  });

  it('should handle API errors gracefully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/gethomedata')
      .reply(400, {
        error: {
          code: {
            type: 'number',
            example: 21,
          },
          message: {
            type: 'string',
            example: 'invalid [parameter]',
          },
        },
      });

    const { cameras, modules } = await netatmoHandler.loadCameraDetails();

    expect(cameras).to.be.eq(undefined);
    expect(modules).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/gethomedata')
      .reply(200, { body: bodyGetCameraMock, status: 'error' });

    const { cameras, modules } = await netatmoHandler.loadCameraDetails();
    expect(cameras).to.deep.eq([]);
    expect(modules).to.deep.eq([]);
    expect(cameras).to.be.an('array');
    expect(modules).to.be.an('array');
    expect(modules).to.have.lengthOf(0);
  });
});
