const { expect } = require('chai');
const { authenticatedRequest, request } = require('../request.test');
const db = require('../../../models');

describe('POST /user', () => {
  it('should create user', async () => {
    await authenticatedRequest
      .post('/api/v1/user')
      .send({
        firstname: 'Tony',
        lastname: 'Stark',
        email: 'tony.stark@gladysassistant.com',
        password: 'testststs',
        birthdate: new Date('01/01/2019'),
        language: 'en',
        role: 'admin',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('id');
      });
  });
  it('should record the origin the account is created from', async () => {
    let sessionId;
    await authenticatedRequest
      .post('/api/v1/user')
      .set('Origin', 'http://gladys.local:1443')
      .send({
        firstname: 'Tony',
        lastname: 'Stark',
        email: 'tony.stark@gladysassistant.com',
        password: 'testststs',
        birthdate: new Date('01/01/2019'),
        language: 'en',
        role: 'admin',
      })
      .expect(201)
      .then((res) => {
        sessionId = res.body.session_id;
      });
    const session = await db.Session.findOne({ where: { id: sessionId } });
    expect(session.origin).to.equal('http://gladys.local:1443');
  });
  it('should not create user, missing email', async () => {
    await authenticatedRequest
      .post('/api/v1/user')
      .send({
        firstname: 'Tony',
        lastname: 'Stark',
        password: 'testststs',
        birthdate: new Date('01/01/2019'),
        language: 'en',
        role: 'admin',
      })
      .expect('Content-Type', /json/)
      .expect(422);
  });
  it('should not create user, duplicate email', async () => {
    await authenticatedRequest
      .post('/api/v1/user')
      .send({
        firstname: 'Tony',
        lastname: 'Stark',
        password: 'testststs',
        email: 'demo@demo.com',
        birthdate: new Date('01/01/2019'),
        language: 'en',
        role: 'admin',
      })
      .expect('Content-Type', /json/)
      .expect(409);
  });
});

describe('POST /signup', () => {
  it('should not create user, instance already configured', async () => {
    await request
      .post('/api/v1/signup')
      .send({
        firstname: 'Tony',
        lastname: 'Stark',
        email: 'tony.stark@gladysassistant.com',
        password: 'testststs',
        birthdate: new Date('01/01/2019'),
        language: 'en',
        role: 'admin',
      })
      .expect('Content-Type', /json/)
      .expect(403)
      .then((res) => {
        expect(res.body).to.have.property('message', 'INSTANCE_ALREADY_CONFIGURED');
      });
  });
});
