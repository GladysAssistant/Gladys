const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

const RANDOM_IMAGE =
  'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

describe('GET /api/v1/camera', () => {
  it('should get list of cameras', async () => {
    await authenticatedRequest
      .get('/api/v1/camera')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((camera) => {
          expect(camera).to.have.property('name');
          expect(camera).to.have.property('features');
          expect(camera).to.have.property('room');
        });
      });
  });
});

describe('POST /api/v1/camera/:camera_selector/image', () => {
  it('should set image', async () => {
    await authenticatedRequest
      .post('/api/v1/camera/test-camera/image')
      .send({
        image: RANDOM_IMAGE,
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.deep.equal({
          success: true,
        });
      });
  });
});

describe('GET /api/v1/camera/:camera_selector/image', () => {
  it('should get image', async () => {
    await authenticatedRequest
      .post('/api/v1/camera/test-camera/image')
      .send({
        image: RANDOM_IMAGE,
      })
      .expect('Content-Type', /json/)
      .expect(201);
    await authenticatedRequest
      .get('/api/v1/camera/test-camera/image')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(200)
      .then((res) => {
        expect(res.text).to.equal(RANDOM_IMAGE);
      });
  });
});
