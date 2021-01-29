const { authenticatedRequest } = require('../request.test');

describe('DELETE /api/v1/user/:user_selector', () => {
  it('should delete a user', async () => {
    // get pepper should return 200
    await authenticatedRequest
      .get('/api/v1/user/pepper')
      .expect('Content-Type', /json/)
      .expect(200);
    // deleting pepper user
    await authenticatedRequest
      .delete('/api/v1/user/pepper')
      .expect('Content-Type', /json/)
      .expect(200);
    // get pepper should return 404
    await authenticatedRequest
      .get('/api/v1/user/pepper')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should try to delete our own account and fail', async () => {
    // delete john should return 400
    await authenticatedRequest
      .delete('/api/v1/user/john')
      .expect('Content-Type', /json/)
      .expect(400);
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .delete('/api/v1/user/USER_DONT_EXIST')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});
