const request = require('supertest');

// ~200 kB of JSON: above the 100 kB bound of the routes serving the
// frontend, below the 20 MB bound of the host API of external integrations.
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

  it('should not read the body of an unauthenticated host API request', async () => {
    // over the 20 MB bound of the host API on purpose: the request is
    // answered 401 rather than 413, which is only possible if the parser is
    // mounted behind the integration authentication and the body is never
    // read. A payload under the bound would pass either way and would not
    // catch a regression putting the parser back in front of the auth.
    const overHostApiBound = { padding: 'x'.repeat(21 * 1024 * 1024) };
    // @ts-ignore
    await request(TEST_BACKEND_APP)
      .post('/api/integration/v1/discovered_device')
      .set('Accept', 'application/json')
      .send(overHostApiBound)
      .expect(401);
  });
});
