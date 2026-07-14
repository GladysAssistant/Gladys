const { expect } = require('chai');
const { fake, stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('GradiumController', () => {
  let readFile;
  let rm;
  let GradiumController;
  let gradiumHandler;
  let res;
  let statusJson;

  beforeEach(() => {
    readFile = stub();
    rm = stub().resolves();
    statusJson = fake();

    GradiumController = proxyquire('../../../../services/gradium/api/gradium.controller', {
      'fs/promises': {
        readFile,
        rm,
      },
      '../../../api/middlewares/asyncMiddleware': (fn) => fn,
    });

    gradiumHandler = {
      basePath: 'medias/gradium',
      getVoices: stub().resolves([{ id: 'voice-id', name: 'French voice' }]),
      gladys: {
        system: {
          isDocker: stub().resolves(false),
          getGladysBasePath: stub().resolves({ basePathOnContainer: '/var/gladys' }),
        },
      },
    };

    res = {
      status: fake.returns({ json: statusJson }),
      json: fake(),
      setHeader: fake(),
      send: fake(),
    };
  });

  it('should return 400 when uuid is invalid', async () => {
    const gradiumController = GradiumController(gradiumHandler);

    await gradiumController['get /api/v1/service/gradium/speech-file/:uuid'].controller(
      {
        params: {
          uuid: 'invalid-file-name',
        },
      },
      res,
    );

    expect(res.status.callCount).to.eq(1);
    expect(res.status.firstCall.args[0]).to.eq(400);
    expect(statusJson.callCount).to.eq(1);
    expect(statusJson.firstCall.args[0]).to.deep.equal({ error: 'Invalid UUID' });
    expect(readFile.callCount).to.eq(0);
  });

  it('should return and delete speech file in non-docker mode', async () => {
    const gradiumController = GradiumController(gradiumHandler);
    const fileData = Buffer.from('audio-content');
    const uuid = '07f16117-8556-4b50-b9f0-e190d08f8d92.ogg';
    readFile.resolves(fileData);

    await gradiumController['get /api/v1/service/gradium/speech-file/:uuid'].controller(
      {
        params: {
          uuid,
        },
      },
      res,
    );

    expect(readFile.callCount).to.eq(1);
    expect(readFile.firstCall.args[0]).to.eq(`medias/gradium/${uuid}`);
    expect(res.setHeader.callCount).to.eq(1);
    expect(res.setHeader.firstCall.args).to.deep.equal(['Content-Type', 'audio/ogg']);
    expect(res.send.callCount).to.eq(1);
    expect(res.send.firstCall.args[0]).to.eq(fileData);
    expect(rm.callCount).to.eq(1);
    expect(rm.firstCall.args[0]).to.eq(`medias/gradium/${uuid}`);
  });

  it('should read speech file from container path in docker mode', async () => {
    const gradiumController = GradiumController(gradiumHandler);
    const fileData = Buffer.from('audio-content');
    const uuid = '07f16117-8556-4b50-b9f0-e190d08f8d92.ogg';

    gradiumHandler.gladys.system.isDocker.resolves(true);
    readFile.resolves(fileData);

    await gradiumController['get /api/v1/service/gradium/speech-file/:uuid'].controller(
      {
        params: {
          uuid,
        },
      },
      res,
    );

    expect(gradiumHandler.gladys.system.getGladysBasePath.callCount).to.eq(1);
    expect(readFile.callCount).to.eq(1);
    expect(readFile.firstCall.args[0]).to.eq(`/var/gladys/medias/gradium/${uuid}`);
    expect(rm.callCount).to.eq(1);
    expect(rm.firstCall.args[0]).to.eq(`/var/gladys/medias/gradium/${uuid}`);
  });

  it('should list voices', async () => {
    const gradiumController = GradiumController(gradiumHandler);

    await gradiumController['get /api/v1/service/gradium/voices'].controller({}, res);

    expect(gradiumHandler.getVoices.callCount).to.eq(1);
    expect(res.json.callCount).to.eq(1);
    expect(res.json.firstCall.args[0]).to.deep.equal([{ id: 'voice-id', name: 'French voice' }]);
  });
});
