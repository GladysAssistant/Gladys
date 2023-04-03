---
to: test/services/<%= module %>/mocks/<%= module %>.mock.test.js
---

const { fake } = require('sinon');

const <%= className %>HandlerMock = function <%= className %>HandlerMock(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

<%= className %>HandlerMock.prototype.stop = fake.returns(null);
<%= className %>HandlerMock.prototype.start = fake.returns(null);
<%= className %>HandlerMock.prototype.getStatus = fake.resolves(true);
<%= className %>HandlerMock.prototype.saveConfiguration = fake.resolves(true);
<%= className %>HandlerMock.prototype.getConfiguration = fake.resolves({
  login: 'login',
  password: 'password',
});

module.exports = {
  <%= className %>HandlerMock,
};
