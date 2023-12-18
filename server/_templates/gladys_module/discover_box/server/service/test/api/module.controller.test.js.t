---
inject: true
to: test/services/<%= module %>/api/<%= module %>.controller.test.js
before: "'GET /api/v1/service/<%= module %>/config"
skip_if: "GET /api/v1/service/<%= module %>/discover"
---
describe('GET /api/v1/service/<%= module %>/discover', () => {
  beforeEach(() => {
    sinon.reset();
    <%= attributeName %>Handler = new <%= className %>HandlerMock({}, serviceId);
    controllers = <%= className %>Controller(<%= attributeName %>Handler);
  });

  it('Discovers <%= module %> devices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controllers['get /api/v1/service/<%= module %>/discover'].controller(req, res);
    assert.calledOnce(<%= attributeName %>Handler.discover);
    assert.calledOnce(res.json);
  });
});