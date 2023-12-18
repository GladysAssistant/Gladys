---
inject: true
to: test/services/<%= module %>/mocks/<%= module %>.mock.test.js
after: "<%= className %>HandlerMock.prototype.getStatus"
skip_if: "<%= className %>HandlerMock.prototype.discover"
---
<%= className %>HandlerMock.prototype.discover = fake.resolves(true);