const { Op } = require('sequelize');

const logger = require('../../utils/logger');
const db = require('../../models');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { Error403, Error429 } = require('../../utils/httpErrors');

/**
 * @description Extract transcription text from Gladys Plus STT response.
 * @param {object|string} sttResponse - STT API response.
 * @returns {string} Transcription text.
 */
function extractTranscriptionFromSttResponse(sttResponse) {
  if (!sttResponse) {
    return '';
  }
  if (typeof sttResponse === 'string') {
    return sttResponse.trim();
  }
  const text = sttResponse.text ?? sttResponse.transcription ?? sttResponse.transcript ?? '';
  return typeof text === 'string' ? text.trim() : '';
}

/**
 * @description Build previous chat exchanges for AI context.
 * @param {string} userId - Gladys user id.
 * @returns {Promise<Array<{question: string|null, answer: string|null}>>} Previous exchanges.
 */
async function getPreviousQuestionsForUser(userId) {
  const previousMessages = await db.Message.findAll({
    where: {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    },
    order: [['created_at', 'desc']],
    limit: 8,
  });

  const previousQuestions = [];
  let currentExchange = null;

  previousMessages.reverse().forEach((msg) => {
    if (msg.sender_id !== null) {
      currentExchange = {
        question: msg.text,
        answer: null,
      };
    } else if (currentExchange && currentExchange.question && !currentExchange.answer) {
      currentExchange.answer = msg.text;
      previousQuestions.push({ ...currentExchange });
      currentExchange = null;
    } else {
      previousQuestions.push({
        question: null,
        answer: msg.text,
      });
    }
  });

  return previousQuestions;
}

/**
 * @public
 * @description Process a voice message: STT, AI reply, websocket updates and TTS URL.
 * @param {object} options - Request options.
 * @param {Buffer} options.audio - Raw audio buffer.
 * @param {object} options.user - Authenticated Gladys user.
 * @returns {Promise<{transcription: string, answer: string, ttsUrl: string|null}>} Voice processing result.
 * @example
 * processVoiceMessage({ audio: buffer, user });
 */
async function processVoiceMessage({ audio, user }) {
  const userId = user.id;

  const emitVoiceWebsocket = (type, payload) => {
    if (this.event?.emit) {
      this.event.emit(EVENTS.WEBSOCKET.SEND, {
        type,
        userId,
        payload,
      });
    }
  };

  emitVoiceWebsocket(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.PROCESSING, { processing: true });

  try {
    const sttResponse = await this.stt(audio);
    const transcription = extractTranscriptionFromSttResponse(sttResponse);

    if (!transcription) {
      throw new Error('EMPTY_TRANSCRIPTION');
    }

    emitVoiceWebsocket(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.TRANSCRIPTION, { text: transcription });

    const message = {
      text: transcription,
      source: 'dashboard',
      language: user.language,
      source_user_id: userId,
      user,
      created_at: new Date(),
    };

    await db.Message.create({
      text: transcription,
      sender_id: userId,
      receiver_id: null,
      is_read: true,
    });

    const previousQuestions = await getPreviousQuestionsForUser(userId);
    const aiResult = await this.forwardMessageToAiChat({
      message,
      previousQuestions,
      context: { user },
    });
    const answer = aiResult?.answer ?? '';

    if (answer) {
      emitVoiceWebsocket(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.RESPONSE, { text: answer });
    }

    let ttsUrl = null;
    if (answer) {
      const ttsResponse = await this.getTTSApiUrl({ text: answer });
      ttsUrl = ttsResponse?.url ?? null;
    }

    return {
      transcription,
      answer,
      ttsUrl,
    };
  } catch (e) {
    logger.warn(e);
    if (e instanceof Error403) {
      emitVoiceWebsocket(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR, {
        error: 'forbidden',
        message: e.message,
      });
      throw e;
    }
    if (e instanceof Error429) {
      emitVoiceWebsocket(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR, {
        error: 'too_many_requests',
        message: e.message,
      });
      throw e;
    }
    emitVoiceWebsocket(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.ERROR, {
      error: 'unknown',
      message: e.message,
    });
    throw e;
  } finally {
    emitVoiceWebsocket(WEBSOCKET_MESSAGE_TYPES.VOICE_ASSISTANT.PROCESSING, { processing: false });
  }
}

module.exports = {
  processVoiceMessage,
  extractTranscriptionFromSttResponse,
  getPreviousQuestionsForUser,
};
