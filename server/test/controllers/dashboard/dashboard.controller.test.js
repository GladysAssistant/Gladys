const { expect } = require('chai');
const nock = require('nock');
const { authenticatedRequest } = require('../request.test');
const { DASHBOARD_VISIBILITY } = require('../../../utils/constants');

describe('POST /api/v1/dashboard', () => {
  it('should create dashboard', async () => {
    await authenticatedRequest
      .post('/api/v1/dashboard')
      .send({
        name: 'my dashboard',
        type: 'main',
        position: 0,
        visibility: DASHBOARD_VISIBILITY.PRIVATE,
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

  it('should create dashboard with photo box', async () => {
    await authenticatedRequest
      .post('/api/v1/dashboard')
      .send({
        name: 'photo dashboard',
        type: 'main',
        position: 0,
        visibility: DASHBOARD_VISIBILITY.PRIVATE,
        boxes: [
          [
            {
              type: 'photo',
              photos: [{ url: 'https://example.com/photo.jpg', caption: 'Vacances' }],
              photo_fit: 'cover',
              photo_slideshow_interval: 10,
              photo_show_caption: true,
            },
          ],
        ],
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('name', 'photo dashboard');
        expect(res.body.boxes[0][0]).to.have.property('type', 'photo');
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
            updated_at: '2019-02-12 07:49:07.556 +00:00',
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
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          visibility: 'private',
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
          position: 0,
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          visibility: 'private',
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

describe('POST /api/v1/dashboard/order', () => {
  it('should update order of dashboards', async () => {
    await authenticatedRequest
      .post('/api/v1/dashboard/order')
      .send(['test-dashboard'])
      .expect('Content-Type', /json/)
      .expect(200);
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

describe('GET /api/v1/dashboard/photo/proxy', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should proxy an external photo', async () => {
    const inputBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    nock('http://192.168.1.10')
      .get('/photos/vacation.jpg')
      .reply(200, inputBuffer, { 'Content-Type': 'image/png' });

    await authenticatedRequest
      .get('/api/v1/dashboard/photo/proxy')
      .query({ url: 'http://192.168.1.10/photos/vacation.jpg' })
      .expect(200)
      .then((res) => {
        expect(res.text).to.match(/^image\/jpeg;base64,/);
      });
  });
});
