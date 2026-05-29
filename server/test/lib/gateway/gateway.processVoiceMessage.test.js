const { expect, assert } = require('chai');
const sinon = require('sinon');

const { fake, assert: sinonAssert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { Error403, Error429 } = require('../../../utils/httpErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const messageCreate = sinon.stub().resolves({});
const getPreviousQuestionsForUserStub = sinon.stub().resolves([]);

const { processVoiceMessage, extractTranscriptionFromSttResponse } = proxyquire(
  '../../../lib/gateway/gateway.processVoiceMessage',
  {
    '../../models': {
      Message: {
        create: messageCreate,
      },
    },
  },
);

const user = {
  id: 'user-1',
  language: 'fr',
};

/**
 * @description Build gateway-like context for processVoiceMessage.
 * @param {object} overrides - Method overrides.
 * @returns {object} Context.
 * @example
 * buildContext({ stt: fake.resolves({ text: 'bonjour' }) });
 */
function buildContext(overrides = {}) {
  return {
    stt: overrides.stt || fake.resolves({ text: 'allume la lumière' }),
    forwardMessageToAiChat: overrides.forwardMessageToAiChat || fake.resolves({ answer: 'La lumière est allumée.' }),
    getTTSApiUrl: overrides.getTTSApiUrl || fake.resolves({ url: 'http://tts.test/audio.mp3' }),
    event: overrides.event === null ? null : overrides.event || { emit: fake() },
    message: overrides.message || {
      getPreviousQuestionsForUser: getPreviousQuestionsForUserStub,
    },
  };
}

describe('gateway.processVoiceMessage helpers', () => {
  beforeEach(() => {
    messageCreate.resetHistory();
    getPreviousQuestionsForUserStub.resetHistory();
    getPreviousQuestionsForUserStub.resolves([]);
  });

  describe('extractTranscriptionFromSttResponse', () => {
    it('should return empty string when response is falsy', () => {
      expect(extractTranscriptionFromSttResponse(null)).to.equal('');
      expect(extractTranscriptionFromSttResponse(undefined)).to.equal('');
    });

    it('should trim string responses', () => {
      expect(extractTranscriptionFromSttResponse('  bonjour  ')).to.equal('bonjour');
    });

    it('should read text field', () => {
      expect(extractTranscriptionFromSttResponse({ text: '  salut  ' })).to.equal('salut');
    });

    it('should read transcription field', () => {
      expect(extractTranscriptionFromSttResponse({ transcription: 'via transcription' })).to.equal('via transcription');
      expect(extractTranscriptionFromSttResponse({ text: undefined, transcription: 'fallback' })).to.equal('fallback');
    });

    it('should read transcript field', () => {
      expect(extractTranscriptionFromSttResponse({ transcript: 'via transcript' })).to.equal('via transcript');
      expect(
        extractTranscriptionFromSttResponse({ text: null, transcription: null, transcript: 'via transcript' }),
      ).to.equal('via transcript');
    });

    it('should return empty string when text field is not a string', () => {
      expect(extractTranscriptionFromSttResponse({ text: 42 })).to.equal('');
    });

    it('should return empty string when no transcription field is present', () => {
      expect(extractTranscriptionFromSttResponse({})).to.equal('');
    });
  });
});

describe('gateway.processVoiceMessage', () => {
  beforeEach(() => {
    messageCreate.resetHistory();
    getPreviousQuestionsForUserStub.resetHistory();
    getPreviousQuestionsForUserStub.resolves([]);
  });

  it('should process voice end-to-end with websocket events', async () => {
    const eventEmit = fake();
    const ctx = buildContext({ event: { emit: eventEmit } });

    const result = await processVoiceMessage.call(ctx, {
      audio: Buffer.from('audio'),
      contentType: 'audio/wav',
      user,
    });

    expect(result).to.deep.equal({
      transcription: 'allume la lumière',
      answer: 'La lumière est allumée.',
      ttsUrl: 'http://tts.test/audio.mp3',
    });
    sinonAssert.calledOnce(ctx.stt);
    sinonAssert.calledWith(ctx.stt, Buffer.from('audio'), 'audio/wav');
    sinonAssert.calledOnce(ctx.message.getPreviousQuestionsForUser);
    sinonAssert.calledWith(ctx.message.getPreviousQuestionsForUser, user.id);
    sinonAssert.calledOnce(messageCreate);
    sinonAssert.callOrder(ctx.message.getPreviousQuestionsForUser, messageCreate);
    sinonAssert.calledOnce(ctx.forwardMessageToAiChat);
    sinonAssert.calledOnce(ctx.getTTSApiUrl);

    const emittedTypes = eventEmit.getCalls().map((call) => call.args[0]);
    expect(emittedTypes).to.include(EVENTS.WEBSOCKET.SEND);

    const payloads = eventEmit.getCalls().map((call) => call.args[1]);
    expect(payloads).to.deep.include({
      type: WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.PROCESSING,
      userId: user.id,
      payload: { processing: true },
    });
    expect(payloads).to.deep.include({
      type: WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.TRANSCRIPTION,
      userId: user.id,
      payload: { text: 'allume la lumière' },
    });
    expect(payloads).to.deep.include({
      type: WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.RESPONSE,
      userId: user.id,
      payload: { text: 'La lumière est allumée.' },
    });
    expect(payloads.filter((p) => p.type === WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.PROCESSING)).to.have.lengthOf(2);
  });

  it('should fetch previous questions before persisting the transcription', async () => {
    const ctx = buildContext();

    await processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user });

    sinonAssert.callOrder(ctx.message.getPreviousQuestionsForUser, messageCreate);
  });

  it('should skip response websocket and tts when answer is empty', async () => {
    const eventEmit = fake();
    const ctx = buildContext({
      event: { emit: eventEmit },
      forwardMessageToAiChat: fake.resolves({ answer: '' }),
    });

    const result = await processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user });

    expect(result).to.deep.equal({
      transcription: 'allume la lumière',
      answer: '',
      ttsUrl: null,
    });
    sinonAssert.notCalled(ctx.getTTSApiUrl);

    const responseEvents = eventEmit
      .getCalls()
      .map((call) => call.args[1])
      .filter((payload) => payload.type === WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.RESPONSE);
    expect(responseEvents).to.have.lengthOf(0);
  });

  it('should handle missing ai result', async () => {
    const ctx = buildContext({
      forwardMessageToAiChat: fake.resolves(null),
    });

    const result = await processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user });

    expect(result.answer).to.equal('');
    expect(result.ttsUrl).to.equal(null);
  });

  it('should handle tts response without url', async () => {
    const ctx = buildContext({
      getTTSApiUrl: fake.resolves({}),
    });

    const result = await processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user });

    expect(result.ttsUrl).to.equal(null);
  });

  it('should not emit websocket events when event bus is missing', async () => {
    const ctx = buildContext({ event: null });

    const result = await processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user });

    expect(result.transcription).to.equal('allume la lumière');
  });

  it('should reject empty transcription', async () => {
    const eventEmit = fake();
    const ctx = buildContext({
      event: { emit: eventEmit },
      stt: fake.resolves({ text: '   ' }),
    });

    await assert.isRejected(
      processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user }),
      Error,
      'EMPTY_TRANSCRIPTION',
    );

    const errorEvents = eventEmit
      .getCalls()
      .map((call) => call.args[1])
      .filter((payload) => payload.type === WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR);
    expect(errorEvents[0].payload).to.deep.equal({ error: 'unknown', message: 'EMPTY_TRANSCRIPTION' });
  });

  it('should emit forbidden websocket error and rethrow Error403', async () => {
    const eventEmit = fake();
    const forbidden = new Error403('forbidden');
    const ctx = buildContext({
      event: { emit: eventEmit },
      stt: fake.rejects(forbidden),
    });

    await assert.isRejected(processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user }), Error403);

    const errorPayload = eventEmit
      .getCalls()
      .map((call) => call.args[1])
      .find((payload) => payload.type === WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR);
    expect(errorPayload.payload).to.deep.equal({ error: 'forbidden', message: 'forbidden' });
  });

  it('should emit rate limit websocket error and rethrow Error429', async () => {
    const eventEmit = fake();
    const tooMany = new Error429('rate limit');
    const ctx = buildContext({
      event: { emit: eventEmit },
      forwardMessageToAiChat: fake.rejects(tooMany),
    });

    await assert.isRejected(processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user }), Error429);

    const errorPayload = eventEmit
      .getCalls()
      .map((call) => call.args[1])
      .find((payload) => payload.type === WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR);
    expect(errorPayload.payload).to.deep.equal({ error: 'too_many_requests', message: '' });
  });

  it('should emit unknown websocket error and rethrow generic errors', async () => {
    const eventEmit = fake();
    const ctx = buildContext({
      event: { emit: eventEmit },
      getTTSApiUrl: fake.rejects(new Error('tts down')),
    });

    await assert.isRejected(processVoiceMessage.call(ctx, { audio: Buffer.from('audio'), user }), 'tts down');

    const errorPayload = eventEmit
      .getCalls()
      .map((call) => call.args[1])
      .find((payload) => payload.type === WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR);
    expect(errorPayload.payload).to.deep.equal({ error: 'unknown', message: 'tts down' });
  });
});
