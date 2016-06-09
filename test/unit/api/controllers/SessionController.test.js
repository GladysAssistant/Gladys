var request = require('supertest');

describe.skip('UserController', function() {

  describe('#login()', function() {
    it('should redirect to /dashboard', function (done) {
     	request(sails.hooks.http.app)
        .post('/session/create')
        .send({ email: 'tony.stark@starkindustry.com', password: 'test1234' })
        .expect(302)
        .expect('location','/dashboard', done);

    });
  });

});