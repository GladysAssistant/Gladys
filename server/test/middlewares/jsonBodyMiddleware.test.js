const request = require('supertest');

// ~200 kB of JSON: above the 100 kB bound of the routes serving the
// frontend, below the 5 MB bound of the host API of external integrations.
const bigBody = { padding: 'x'.repeat(200 * 1024) };

describe('jsonBodyMiddleware', () => {
  it('should reject a body over 100 kB on the routes serving the frontend', async () => {
    // @ts-ignore
    await request(TEST_BACKEND_APP)
      .post('/api/v1/scene')
      .set('Accept', 'application/json')
      .send(bigBody)
      .expect(413);
  });

  it('should accept a body over 100 kB on the host API of external integrations', async () => {
    // the body is parsed (no 413), the request then dies on authentication:
    // the batch endpoints of the host API get a 5 MB bound
    // @ts-ignore
    await request(TEST_BACKEND_APP)
      .post('/api/integration/v1/discovered_device')
      .set('Accept', 'application/json')
      .send(bigBody)
      .expect(401);
  });
});
