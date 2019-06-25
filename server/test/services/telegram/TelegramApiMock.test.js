const { fake } = require('sinon');
const EventEmitter = require('events');

class TelegramApiMock extends EventEmitter {
  constructor(token) {
    super();
    this.token = token;
  }
}

TelegramApiMock.prototype.getMe = fake.resolves({
  username: 'faketelegrambot',
});

TelegramApiMock.prototype.sendMessage = fake.resolves(null);
TelegramApiMock.prototype.sendPhoto = fake.resolves(null);

module.exports = TelegramApiMock;
