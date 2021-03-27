const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /api/v1/remote-control/:type', () => {
  it('should get list of remotes', async () => {
    await authenticatedRequest
      .get('/api/v1/remote-control/television')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((remote) => {
          expect(remote).to.have.property('name');
          expect(remote).to.have.property('selector');
          expect(remote).to.have.property('model', 'remote-control:television');
        });
      });
  });
});
