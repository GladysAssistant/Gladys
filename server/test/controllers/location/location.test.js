const { expect } = require('chai');
const { authenticatedRequest, nonAdminRequest, NON_ADMIN_USER_ID } = require('../request.test');
const db = require('../../../models');
const { USER_ROLE, EVENTS } = require('../../../utils/constants');

const NON_ADMIN_USER = {
  id: NON_ADMIN_USER_ID,
  firstname: 'Pepper',
  lastname: 'Potts',
  selector: 'pepper-habitant',
  email: 'pepper-habitant@pots.com',
  language: 'en',
  role: USER_ROLE.HABITANT,
};

describe('POST /api/v1/user/:user_selector/location', () => {
  it('should save user location', async () => {
    await authenticatedRequest
      .post('/api/v1/user/john/location')
      .send({
        latitude: 12,
        longitude: 12,
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('latitude', 12);
        expect(res.body).to.have.property('longitude', 12);
        expect(res.body).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
      });
  });
});

describe('GET /api/v1/user/:user_selector/location', () => {
  it('should return history of location', async () => {
    await authenticatedRequest
      .get('/api/v1/user/john/location')
      .query({
        from: '2018-04-02 04:41:09',
        to: '2019-04-02 04:41:09',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((location) => {
          expect(location).to.have.property('latitude');
          expect(location).to.have.property('longitude');
          expect(location).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
        });
      });
  });
});

// A user's location history is personal data, and writing a location feeds
// zone-based scenes: a non-admin user can only read and write their own, while
// an admin can still feed the positions of the whole household.
describe('Location routes access control', () => {
  beforeEach(async () => {
    await db.User.create({ ...NON_ADMIN_USER, password: 'mysuperpassword', birthdate: '1990-12-12' });
  });

  it('should let a non-admin save their own location', async () => {
    await nonAdminRequest
      .post('/api/v1/user/pepper-habitant/location')
      .send({ latitude: 12, longitude: 12 })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('user_id', NON_ADMIN_USER_ID);
      });
  });

  it('should not let a non-admin save the location of another user', async () => {
    await nonAdminRequest
      .post('/api/v1/user/john/location')
      .send({ latitude: 12.3456, longitude: 65.4321 })
      .expect('Content-Type', /json/)
      .expect(403);
    const locations = await db.Location.count({ where: { latitude: 12.3456, longitude: 65.4321 } });
    expect(locations).to.equal(0);
  });

  it('should let a non-admin read their own location history', async () => {
    await nonAdminRequest
      .get('/api/v1/user/pepper-habitant/location')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('array');
      });
  });

  it('should not let a non-admin read the location history of another user', async () => {
    await nonAdminRequest
      .get('/api/v1/user/john/location')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('should let an admin save the location of another user', async () => {
    await authenticatedRequest
      .post('/api/v1/user/pepper-habitant/location')
      .send({ latitude: 12, longitude: 12 })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('user_id', NON_ADMIN_USER_ID);
      });
  });

  it('should not let a non-admin save the location of another user through the Gladys Plus gateway', (done) => {
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.event.emit(
      EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
      NON_ADMIN_USER,
      'POST',
      '/api/v1/user/john/location',
      {},
      { latitude: 12, longitude: 12 },
      (data) => {
        expect(data).to.have.property('status', 403);
        expect(data).to.have.property('code', 'FORBIDDEN');
        done();
      },
    );
  });
});
