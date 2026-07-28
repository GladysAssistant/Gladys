const { expect } = require('chai');
const { fake, assert } = require('sinon');

const MessageHandler = require('../../../../services/telegram/lib');

const buildMessageHandler = () => {
  const messageHandler = new MessageHandler({}, {}, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
  messageHandler.bot = {
    sendMessage: fake.resolves(null),
    sendPhoto: fake.resolves(null),
  };
  return messageHandler;
};

describe('Telegram.message.send', () => {
  it('should throw when Telegram is not configured', async () => {
    const messageHandler = new MessageHandler({}, {}, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
    try {
      await messageHandler.send('chat-id', { text: 'Hello' });
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('Telegram not configured');
    }
  });

  it('should send the message converted to Telegram HTML', async () => {
    const messageHandler = buildMessageHandler();
    await messageHandler.send('chat-id', { text: 'It is **27 °C** in the living room.' });
    assert.calledOnceWithExactly(messageHandler.bot.sendMessage, 'chat-id', 'It is <b>27 °C</b> in the living room.', {
      parse_mode: 'HTML',
    });
  });

  it('should send the message with the suggestion keyboard', async () => {
    const messageHandler = buildMessageHandler();
    await messageHandler.send('chat-id', { text: 'Hello' }, { suggestion: [['Yes', 'No']] });
    assert.calledOnceWithExactly(messageHandler.bot.sendMessage, 'chat-id', 'Hello', {
      parse_mode: 'HTML',
      reply_markup: {
        one_time_keyboard: true,
        keyboard: [['Yes', 'No']],
      },
    });
  });

  it('should fallback to plain text when Telegram rejects the formatted message', async () => {
    const messageHandler = buildMessageHandler();
    messageHandler.bot.sendMessage = fake(async (chatId, text, options) => {
      if (options.parse_mode) {
        throw new Error("ETELEGRAM: 400 Bad Request: can't parse entities");
      }
      return null;
    });
    await messageHandler.send('chat-id', { text: 'It is **27 °C**.' });
    assert.calledTwice(messageHandler.bot.sendMessage);
    assert.calledWithExactly(messageHandler.bot.sendMessage.secondCall, 'chat-id', 'It is **27 °C**.', {});
  });

  it('should not send a message when there is no text', async () => {
    const messageHandler = buildMessageHandler();
    await messageHandler.send('chat-id', { text: '', file: 'data:image/jpg;base64,aGVsbG8=' });
    assert.notCalled(messageHandler.bot.sendMessage);
    assert.calledOnce(messageHandler.bot.sendPhoto);
  });

  it('should send the file attached to the message', async () => {
    const messageHandler = buildMessageHandler();
    const file = 'data:image/jpg;base64,aGVsbG8=';
    await messageHandler.send('chat-id', { text: 'Here it is', file });
    assert.calledOnce(messageHandler.bot.sendMessage);
    assert.calledOnceWithExactly(messageHandler.bot.sendPhoto, 'chat-id', Buffer.from(file.substr(17), 'base64'), {
      filename: 'image',
      contentType: 'image/jpg',
    });
  });
});
