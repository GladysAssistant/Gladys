const sinon = require('sinon').createSandbox();

const { fake } = sinon;
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

TelegramApiMock.prototype.stopPolling = fake.resolves(null);
TelegramApiMock.prototype.sendMessage = fake.resolves(null);
TelegramApiMock.prototype.sendPhoto = fake.resolves(null);

module.exports = TelegramApiMock;

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
