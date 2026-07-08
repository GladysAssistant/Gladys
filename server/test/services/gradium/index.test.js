const { expect } = require('chai');
const { stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

describe('GradiumService', () => {
  let gladys;
  let service;
  let gradiumHandler;
  let GradiumHandlerMock;
  let GradiumControllerMock;

  beforeEach(() => {
    gradiumHandler = {
      getVoices: stub(),
      getTTSApiUrl: stub(),
    };

    GradiumHandlerMock = stub().returns(gradiumHandler);
    GradiumControllerMock = stub().returns({
      'get /api/v1/service/gradium/voices': {
        controller: stub(),
      },
    });

    const GradiumService = proxyquire('../../../services/gradium/index', {
      './lib': GradiumHandlerMock,
      './api/gradium.controller': GradiumControllerMock,
    });

    gladys = {
      variable: {
        getValue: stub(),
      },
    };

    service = GradiumService(gladys, 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa');
  });

  it('should expose service API', () => {
    expect(service.start).to.be.a('function');
    expect(service.stop).to.be.a('function');
    expect(service.controllers).to.deep.equal({
      'get /api/v1/service/gradium/voices': {
        controller: service.controllers['get /api/v1/service/gradium/voices'].controller,
      },
    });
    expect(service.tts).to.equal(gradiumHandler);
    expect(GradiumHandlerMock.callCount).to.equal(1);
    expect(GradiumControllerMock.callCount).to.equal(1);
  });

  it('should start service when required variables are configured', async () => {
    gladys.variable.getValue
      .withArgs('GRADIUM_ENDPOINT', 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa')
      .resolves('my-endpoint');
    gladys.variable.getValue.withArgs('GRADIUM_API_KEY', 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa').resolves('api-key');
    gladys.variable.getValue.withArgs('GRADIUM_VOICE_ID', 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa').resolves('voice-id');

    await service.start();

    expect(gladys.variable.getValue.callCount).to.equal(3);
  });

  it('should throw when service is not configured', async () => {
    gladys.variable.getValue
      .withArgs('GRADIUM_ENDPOINT', 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa')
      .resolves('my-endpoint');
    gladys.variable.getValue.withArgs('GRADIUM_API_KEY', 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa').resolves(null);
    gladys.variable.getValue.withArgs('GRADIUM_VOICE_ID', 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa').resolves('voice-id');

    await expect(service.start()).to.be.rejectedWith(ServiceNotConfiguredError);
  });

  it('should stop service', async () => {
    await service.stop();

    expect(service.stop).to.be.a('function');
  });
});
