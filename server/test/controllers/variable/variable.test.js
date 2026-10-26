const { expect } = require('chai');
const { authenticatedRequest, nonAdminRequest, NON_ADMIN_USER_ID } = require('../request.test');
const db = require('../../../models');
const { USER_ROLE, EVENTS } = require('../../../utils/constants');

describe('GET /api/v1/variable/:variable_name', () => {
  it('should get a variable', async () => {
    await authenticatedRequest
      .get('/api/v1/variable/GLADYS_GATEWAY_RSA_PUBLIC_KEY')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          value: 'VALUE',
        });
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .get('/api/v1/variable/NOT_FOUND')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe('GET /api/v1/service/:service_name/variable/:variable_name', () => {
  it('should get a variable by service', async () => {
    await authenticatedRequest
      .get('/api/v1/service/test-service/variable/SECURE_VARIABLE')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          value: 'VALUE',
        });
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .get('/api/v1/service/test-service/variable/NOT_FOUND')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe('POST /api/v1/service/:service_name/variable/:variable_name', () => {
  it('should set a variable for a service', async () => {
    await authenticatedRequest
      .post('/api/v1/service/test-service/variable/SECURE_VARIABLE')
      .send({
        value: 'NEW_SERVICE_DATA',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('value', 'NEW_SERVICE_DATA');
      });
  });
});

describe('POST /api/v1/user/variable/:variable_name', () => {
  it('should create a user variable', async () => {
    await authenticatedRequest
      .post('/api/v1/user/variable/INTEGRATION_FAVORITES')
      .send({
        value: '["zigbee2mqtt","mqtt"]',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('value', '["zigbee2mqtt","mqtt"]');
        expect(res.body).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
      });
  });
  it('should update an existing user variable', async () => {
    // First create
    await authenticatedRequest
      .post('/api/v1/user/variable/INTEGRATION_FAVORITES')
      .send({
        value: '["zigbee2mqtt"]',
      })
      .expect(200);
    // Then update
    await authenticatedRequest
      .post('/api/v1/user/variable/INTEGRATION_FAVORITES')
      .send({
        value: '["zigbee2mqtt","mqtt","philips-hue"]',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('value', '["zigbee2mqtt","mqtt","philips-hue"]');
      });
  });
});

describe('GET /api/v1/user/variable/:variable_name', () => {
  it('should get a user variable', async () => {
    // First create the variable
    await authenticatedRequest
      .post('/api/v1/user/variable/INTEGRATION_FAVORITES')
      .send({
        value: '["zigbee2mqtt"]',
      })
      .expect(200);
    // Then read it back
    await authenticatedRequest
      .get('/api/v1/user/variable/INTEGRATION_FAVORITES')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          value: '["zigbee2mqtt"]',
        });
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .get('/api/v1/user/variable/NOT_FOUND_USER_VAR')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe('POST /api/v1/variable/:variable_name', () => {
  it('should create a variable', async () => {
    await authenticatedRequest
      .post('/api/v1/variable/NEW_VARIABLE_VALUE')
      .send({
        value: 'NEW_DATA',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('value', 'NEW_DATA');
      });
  });
  it('should update existing variable', async () => {
    await authenticatedRequest
      .post('/api/v1/variable/GLADYS_GATEWAY_RSA_PUBLIC_KEY')
      .send({
        value: 'NEW_DATA',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('value', 'NEW_DATA');
      });
  });
});

// Service and global variables hold the credentials of the integrations
// (Telegram bot token, MQTT broker password, Netatmo OAuth tokens...) and the
// instance-wide Gladys Plus keys. They used to be readable and writable by any
// authenticated user, guests included.
describe('Variable routes access control', () => {
  const seedNonAdminUser = () =>
    db.User.create({
      id: NON_ADMIN_USER_ID,
      firstname: 'Pepper',
      lastname: 'Potts',
      selector: 'pepper-habitant',
      email: 'pepper-habitant@pots.com',
      password: 'mysuperpassword',
      role: USER_ROLE.HABITANT,
      language: 'en',
      birthdate: '1990-12-12',
    });

  beforeEach(async () => {
    await seedNonAdminUser();
  });

  describe('service-wide variables', () => {
    it('should not let a non-admin read a service secret', async () => {
      await nonAdminRequest
        .get('/api/v1/service/test-service/variable/SECURE_VARIABLE')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('should not let a non-admin write a service secret', async () => {
      await nonAdminRequest
        .post('/api/v1/service/test-service/variable/SECURE_VARIABLE')
        .send({ value: 'HACKED' })
        .expect('Content-Type', /json/)
        .expect(403);
      // the stored value is untouched
      const variable = await db.Variable.findOne({
        where: { name: 'SECURE_VARIABLE', service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279', user_id: null },
      });
      expect(variable).to.have.property('value', 'VALUE');
    });

    it('should not let a non-admin read a service secret through the Gladys Plus gateway', (done) => {
      const user = {
        id: NON_ADMIN_USER_ID,
        firstname: 'Pepper',
        lastname: 'Potts',
        selector: 'pepper-habitant',
        email: 'pepper-habitant@pots.com',
        language: 'en',
        role: USER_ROLE.HABITANT,
      };
      // @ts-ignore
      global.TEST_GLADYS_INSTANCE.event.emit(
        EVENTS.GATEWAY.NEW_MESSAGE_API_CALL,
        user,
        'GET',
        '/api/v1/service/test-service/variable/SECURE_VARIABLE',
        {},
        {},
        (data) => {
          expect(data).to.have.property('status', 403);
          expect(data).to.have.property('code', 'FORBIDDEN');
          done();
        },
      );
    });

    it('should still let an admin read a service secret', async () => {
      await authenticatedRequest
        .get('/api/v1/service/test-service/variable/SECURE_VARIABLE')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ value: 'VALUE' });
        });
    });
  });

  // the per-user side of the same routes is what the CalDAV, Nextcloud Talk
  // and CallMeBot account pages use: every user configures their own account
  // there, so it must stay open to them.
  describe('user-scoped service variables', () => {
    it('should let a non-admin write then read their own service variable', async () => {
      await nonAdminRequest
        .post('/api/v1/service/test-service/variable/CALDAV_PASSWORD')
        .send({ value: 'my-own-password', userRelated: true })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('value', 'my-own-password');
          expect(res.body).to.have.property('user_id', NON_ADMIN_USER_ID);
        });

      await nonAdminRequest
        .get('/api/v1/service/test-service/variable/CALDAV_PASSWORD?userRelated=true')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ value: 'my-own-password' });
        });
    });

    it('should not let a user-scoped read reach the service-wide variable', async () => {
      // SECURE_VARIABLE exists service-wide only: asking for it as a user
      // variable must not fall back on the service-wide row
      await nonAdminRequest.get('/api/v1/service/test-service/variable/SECURE_VARIABLE?userRelated=true').expect(404);
    });
  });

  describe('global variables', () => {
    it('should not let a non-admin read a global variable', async () => {
      await nonAdminRequest
        .get('/api/v1/variable/GLADYS_GATEWAY_RSA_PUBLIC_KEY')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('should not let a non-admin write a global variable', async () => {
      await nonAdminRequest
        .post('/api/v1/variable/GLADYS_GATEWAY_RSA_PUBLIC_KEY')
        .send({ value: 'CORRUPTED' })
        .expect('Content-Type', /json/)
        .expect(403);
      const variable = await db.Variable.findOne({
        where: { name: 'GLADYS_GATEWAY_RSA_PUBLIC_KEY', service_id: null, user_id: null },
      });
      expect(variable).to.have.property('value', 'VALUE');
    });
  });

  // /api/v1/user/variable can only ever touch the caller's own row
  describe('user variables', () => {
    it('should still let a non-admin manage their own variables', async () => {
      await nonAdminRequest
        .post('/api/v1/user/variable/INTEGRATION_FAVORITES')
        .send({ value: '["mqtt"]' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('user_id', NON_ADMIN_USER_ID);
        });

      await nonAdminRequest
        .get('/api/v1/user/variable/INTEGRATION_FAVORITES')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ value: '["mqtt"]' });
        });
    });
  });
});
