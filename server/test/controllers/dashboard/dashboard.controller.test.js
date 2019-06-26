const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/dashboard', () => {
  it('should create dashboard', async () => {
    await authenticatedRequest
      .post('/api/v1/dashboard')
      .send({
        name: 'my dashboard',
        type: 'main',
        boxes: [
          [
            {
              type: 'weather',
            },
          ],
        ],
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'my dashboard');
        expect(res.body).to.have.property('type', 'main');
      });
  });
});

describe('GET /api/v1/dashboard', () => {
  it('should list dashboard', async () => {
    await authenticatedRequest
      .get('/api/v1/dashboard')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: '854dda11-80c0-4476-843b-65cbc95c6a85',
            name: 'Test dashboard',
            selector: 'test-dashboard',
            type: 'main',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
});

describe('GET /api/v1/dashboard/:dashboard_selector', () => {
  it('should list dashboard', async () => {
    await authenticatedRequest
      .get('/api/v1/dashboard/test-dashboard')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '854dda11-80c0-4476-843b-65cbc95c6a85',
          name: 'Test dashboard',
          selector: 'test-dashboard',
          type: 'main',
          boxes: [
            [
              {
                type: 'weather',
              },
            ],
          ],
          updated_at: '2019-02-12T07:49:07.556Z',
          created_at: '2019-02-12T07:49:07.556Z',
        });
      });
  });
});

describe('PATCH /api/v1/dashboard/:dashboard_selector', () => {
  it('should patch dashboard', async () => {
    await authenticatedRequest
      .patch('/api/v1/dashboard/test-dashboard')
      .send({
        name: 'new name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '854dda11-80c0-4476-843b-65cbc95c6a85',
          name: 'new name',
          selector: 'test-dashboard',
          type: 'main',
          boxes: [
            [
              {
                type: 'weather',
              },
            ],
          ],
          updated_at: res.body.updated_at,
          created_at: '2019-02-12T07:49:07.556Z',
        });
      });
  });
});

describe('DELETE /api/v1/dashboard/:dashboard_selector', () => {
  it('should patch dashboard', async () => {
    await authenticatedRequest
      .delete('/api/v1/dashboard/test-dashboard')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          success: true,
        });
      });
  });
});
