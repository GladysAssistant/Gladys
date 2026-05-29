const { expect } = require('chai');
const { fake, assert: sinonAssert } = require('sinon');

const GatewayController = require('../../../api/controllers/gateway.controller');

describe('gateway.controller voice endpoints', () => {
  let res;
  let gladys;

  beforeEach(() => {
    res = {
      json: fake(),
    };
    gladys = {
      gateway: {
        stt: fake.resolves({ text: 'bonjour' }),
        processVoiceMessage: fake.resolves({
          transcription: 'bonjour',
          answer: 'Bonjour !',
          ttsUrl: 'http://tts.test/audio.mp3',
        }),
        getTTSApiUrl: fake.resolves({ url: 'http://tts.test/audio.mp3' }),
      },
    };
  });

  it('should call gateway stt with default content type when header is missing', async () => {
    const controller = GatewayController(gladys);
    const audioBuffer = Buffer.from('fake-audio');

    await controller.stt({ body: audioBuffer, headers: {} }, res);

    sinonAssert.calledWith(gladys.gateway.stt, audioBuffer, 'application/octet-stream');
  });

  it('should call gateway stt with raw audio buffer', async () => {
    const controller = GatewayController(gladys);
    const audioBuffer = Buffer.from('fake-audio');

    await controller.stt({ body: audioBuffer, headers: { 'content-type': 'audio/wav' } }, res);

    sinonAssert.calledOnce(gladys.gateway.stt);
    const audioArg = gladys.gateway.stt.firstCall.args[0];
    const contentTypeArg = gladys.gateway.stt.firstCall.args[1];
    expect(Buffer.isBuffer(audioArg)).to.equal(true);
    expect(audioArg.toString()).to.equal('fake-audio');
    expect(contentTypeArg).to.equal('audio/wav');
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ text: 'bonjour' });
  });

  it('should call gateway processVoiceMessage with user and audio', async () => {
    const controller = GatewayController(gladys);
    const reqUser = { id: 'user-42', language: 'fr' };
    const audioBuffer = Buffer.from('voice');

    await controller.processVoice({ body: audioBuffer, headers: { 'content-type': 'audio/webm' }, user: reqUser }, res);

    sinonAssert.calledOnce(gladys.gateway.processVoiceMessage);
    expect(gladys.gateway.processVoiceMessage.firstCall.args[0]).to.deep.equal({
      audio: Buffer.from('voice'),
      contentType: 'audio/webm',
      user: reqUser,
    });
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({
      transcription: 'bonjour',
      answer: 'Bonjour !',
      ttsUrl: 'http://tts.test/audio.mp3',
    });
  });

  it('should call gateway getTTSApiUrl', async () => {
    const controller = GatewayController(gladys);
    const body = { text: 'Réponse vocale' };

    await controller.getTtsUrl({ body }, res);

    sinonAssert.calledOnce(gladys.gateway.getTTSApiUrl);
    expect(gladys.gateway.getTTSApiUrl.firstCall.args[0]).to.deep.equal(body);
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ url: 'http://tts.test/audio.mp3' });
  });
});
