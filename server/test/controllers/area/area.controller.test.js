const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/area', () => {
  it('should create area', async () => {
    await authenticatedRequest
      .post('/api/v1/area')
      .send({
        name: 'my area',
        latitude: 12,
        longitude: 12,
        radius: 1000,
        color: '#1000',
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'my area');
        expect(res.body).to.have.property('latitude', 12);
        expect(res.body).to.have.property('radius', 1000);
      });
  });
});

describe('PATCH /api/v1/area/:area_selector', () => {
  it('should update a area', async () => {
    await authenticatedRequest
      .patch('/api/v1/area/test-area')
      .send({
        name: 'new name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'new name');
      });
  });
});

describe('DELETE /api/v1/area/:area_selector', () => {
  it('should delete a area', async () => {
    await authenticatedRequest
      .delete('/api/v1/area/test-area')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
});

describe('GET /api/v1/area', () => {
  it('should GET all areas', async () => {
    await authenticatedRequest
      .get('/api/v1/area')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((area) => {
          expect(area).to.have.property('name');
          expect(area).to.have.property('latitude');
          expect(area).to.have.property('longitude');
          expect(area).to.have.property('radius');
          expect(area).to.have.property('color');
        });
      });
  });
});

describe('GET /api/v1/area/:selector', () => {
  it('should get one area by selector', async () => {
    await authenticatedRequest
      .get('/api/v1/area/test-area')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '939ff9b0-d349-483e-9a16-04e3ff03f1cd',
          name: 'Test area',
          selector: 'test-area',
          latitude: 10,
          longitude: 10,
          radius: 1000,
          color: '#0000',
          created_at: '2019-02-12T07:49:07.556Z',
          updated_at: '2019-02-12T07:49:07.556Z',
        });
      });
  });
});
