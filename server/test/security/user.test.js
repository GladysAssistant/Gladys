const { expect } = require('chai');
const { request, authenticatedRequest } = require('../controllers/request.test');

describe('/api/v1/user/', () => {
  it('should return all users with password - regular user', async () => {
    await authenticatedRequest
      .get('/api/v1/user?fields=password')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res)=>{
        console.log(res.body)
      })
   });
})

