const { expect } = require('chai');
const { request, authenticatedRequest } = require('../controllers/request.test');

describe('/api/v1/user/', () => {
  it('should return all users without password', async () => {
    await authenticatedRequest
      .get('/api/v1/user?fields=password')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res)=>{
        expect(res.body).to.not.have.key('password')
      })
   });
})

