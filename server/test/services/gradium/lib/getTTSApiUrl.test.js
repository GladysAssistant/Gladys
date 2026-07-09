const { expect } = require('chai');
const { stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('getTTSApiUrl', () => {
  let mkdir;
  let writeFile;
  let rm;
  let randomUUID;
  let warn;
  let getTTSApiUrl;
  let oldNodeEnv;
  let oldPort;

  beforeEach(() => {
    mkdir = stub().resolves();
    writeFile = stub().resolves();
    rm = stub().resolves();
    randomUUID = stub().returns('07f16117-8556-4b50-b9f0-e190d08f8d92');
    warn = stub();

    ({ getTTSApiUrl } = proxyquire('../../../../services/gradium/lib/getTTSApiUrl', {
      'fs/promises': {
        mkdir,
        writeFile,
        rm,
      },
      crypto: {
        randomUUID,
      },
      '../../../utils/logger': {
        warn,
      },
    }));

    oldNodeEnv = process.env.NODE_ENV;
    oldPort = process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.PORT;
  });

  afterEach(() => {
    process.env.NODE_ENV = oldNodeEnv;
    process.env.PORT = oldPort;
  });

  it('should generate tts file url in non-docker mode', async () => {
    const context = {
      serviceId: 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa',
      basePath: 'medias/gradium',
      gladys: {
        variable: {
          getValue: stub(),
        },
        http: {
          request: stub().resolves({
            data: Buffer.from('audio-content'),
          }),
        },
        system: {
          isDocker: stub().resolves(false),
          getInfos: stub().resolves({
            network_interfaces: {
              lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
              en0: [{ family: 'IPv4', internal: false, address: '192.168.1.24' }],
            },
          }),
        },
      },
    };

    context.gladys.variable.getValue.withArgs('GRADIUM_ENDPOINT', context.serviceId).resolves('my-endpoint');
    context.gladys.variable.getValue.withArgs('GRADIUM_API_KEY', context.serviceId).resolves('my-api-key');
    context.gladys.variable.getValue.withArgs('GRADIUM_VOICE_ID', context.serviceId).resolves('my-voice-id');

    const result = await getTTSApiUrl.call(context, { text: 'Bonjour Gladys' });

    expect(context.gladys.http.request.callCount).to.equal(1);
    expect(context.gladys.http.request.firstCall.args).to.deep.equal([
      'post',
      'https://my-endpoint.api.gradium.ai/api/post/speech/tts',
      {
        text: 'Bonjour Gladys',
        voice_id: 'my-voice-id',
        output_format: 'opus',
        only_audio: true,
      },
      {
        'x-api-key': 'my-api-key',
        'Content-Type': 'application/json',
      },
      'arraybuffer',
    ]);
    expect(mkdir.callCount).to.equal(1);
    expect(mkdir.firstCall.args).to.deep.equal(['medias/gradium', { recursive: true }]);
    expect(writeFile.callCount).to.equal(1);
    expect(writeFile.firstCall.args[0]).to.equal('medias/gradium/07f16117-8556-4b50-b9f0-e190d08f8d92.ogg');
    expect(result).to.equal(
      'http://192.168.1.24:1443/api/v1/service/gradium/speech-file/07f16117-8556-4b50-b9f0-e190d08f8d92.ogg',
    );
  });

  it('should generate tts file url in docker mode and production', async () => {
    process.env.NODE_ENV = 'production';

    const context = {
      serviceId: 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa',
      basePath: 'medias/gradium',
      gladys: {
        variable: {
          getValue: stub(),
        },
        http: {
          request: stub().resolves({
            data: Buffer.from('audio-content'),
          }),
        },
        system: {
          isDocker: stub().resolves(true),
          getGladysBasePath: stub().resolves({ basePathOnContainer: '/var/gladys' }),
          getInfos: stub().resolves({
            network_interfaces: {
              en0: [{ family: 'IPv4', internal: false, address: '10.0.0.3' }],
            },
          }),
        },
      },
    };

    context.gladys.variable.getValue.withArgs('GRADIUM_ENDPOINT', context.serviceId).resolves('my-endpoint');
    context.gladys.variable.getValue.withArgs('GRADIUM_API_KEY', context.serviceId).resolves('my-api-key');
    context.gladys.variable.getValue.withArgs('GRADIUM_VOICE_ID', context.serviceId).resolves('my-voice-id');

    const result = await getTTSApiUrl.call(context, { text: 'Bonjour Gladys' });

    expect(context.gladys.system.getGladysBasePath.callCount).to.equal(1);
    expect(mkdir.callCount).to.equal(1);
    expect(mkdir.firstCall.args).to.deep.equal(['/var/gladys/medias/gradium', { recursive: true }]);
    expect(writeFile.callCount).to.equal(1);
    expect(writeFile.firstCall.args[0]).to.equal('/var/gladys/medias/gradium/07f16117-8556-4b50-b9f0-e190d08f8d92.ogg');
    expect(result).to.equal(
      'http://10.0.0.3/api/v1/service/gradium/speech-file/07f16117-8556-4b50-b9f0-e190d08f8d92.ogg',
    );
  });

  it('should return empty string on failure after uuid generation', async () => {
    writeFile.rejects(new Error('disk full'));

    const context = {
      serviceId: 'f2660e4d-fc4e-4cb6-af0e-f281d00f00aa',
      basePath: 'medias/gradium',
      gladys: {
        variable: {
          getValue: stub(),
        },
        http: {
          request: stub().resolves({
            data: Buffer.from('audio-content'),
          }),
        },
        system: {
          isDocker: stub().resolves(false),
          getInfos: stub().resolves({
            network_interfaces: {
              en0: [{ family: 'IPv4', internal: false, address: '10.0.0.3' }],
            },
          }),
        },
      },
    };

    context.gladys.variable.getValue.withArgs('GRADIUM_ENDPOINT', context.serviceId).resolves('my-endpoint');
    context.gladys.variable.getValue.withArgs('GRADIUM_API_KEY', context.serviceId).resolves('my-api-key');
    context.gladys.variable.getValue.withArgs('GRADIUM_VOICE_ID', context.serviceId).resolves('my-voice-id');

    const result = await getTTSApiUrl.call(context, { text: 'Bonjour Gladys' });

    expect(result).to.equal('');
    expect(warn.callCount).to.equal(1);
    expect(warn.firstCall.args[0]).to.equal('Gradium TTS request failed');
    expect(warn.firstCall.args[1]).to.equal('disk full');
    expect(rm.callCount).to.equal(1);
    expect(rm.firstCall.args[0]).to.equal('medias/gradium/07f16117-8556-4b50-b9f0-e190d08f8d92.ogg');
  });
});
