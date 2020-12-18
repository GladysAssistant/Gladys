const { fake } = require('sinon');
const EventEmitter = require('events');

class PushoverApiMock extends EventEmitter {
  constructor(token) {
    super();
    this.token = token;
  }
}

PushoverApiMock.prototype.getMe = fake.resolves({
  username: 'pushoveruser',
});

PushoverApiMock.prototype.sendMessage = fake.resolves(null);

module.exports = PushoverApiMock;
