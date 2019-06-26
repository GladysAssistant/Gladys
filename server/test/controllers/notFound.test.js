const { request } = require('./request.test');

describe('GET /thisroutedoesntexist', () => {
  it('should return 404 not found', async () => {
    await request.get('/thisroutedoesntexist').expect(404);
  });
});
