const { fake } = require('sinon');
const EventEmitter = require('events');

class SlackApiMock extends EventEmitter {
  constructor(token) {
    super();
    this.token = token;
  }
}

SlackApiMock.prototype.sendMessage = fake.resolves(null);
SlackApiMock.prototype.start = fake.resolves(null);

module.exports = SlackApiMock;
