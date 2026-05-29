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

  it('should call gateway stt with decoded audio buffer', async () => {
    const controller = GatewayController(gladys);
    const audioBase64 = Buffer.from('fake-audio').toString('base64');

    await controller.stt({ body: { audio: audioBase64 } }, res);

    sinonAssert.calledOnce(gladys.gateway.stt);
    const audioArg = gladys.gateway.stt.firstCall.args[0];
    expect(Buffer.isBuffer(audioArg)).to.equal(true);
    expect(audioArg.toString()).to.equal('fake-audio');
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ text: 'bonjour' });
  });

  it('should call gateway processVoiceMessage with user and audio', async () => {
    const controller = GatewayController(gladys);
    const reqUser = { id: 'user-42', language: 'fr' };
    const audioBase64 = Buffer.from('voice').toString('base64');

    await controller.processVoice({ body: { audio: audioBase64 }, user: reqUser }, res);

    sinonAssert.calledOnce(gladys.gateway.processVoiceMessage);
    expect(gladys.gateway.processVoiceMessage.firstCall.args[0]).to.deep.equal({
      audio: Buffer.from('voice'),
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
