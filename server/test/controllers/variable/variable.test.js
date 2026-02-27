const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

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
