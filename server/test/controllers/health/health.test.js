const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');

describe('GET /api/v1/health', () => {
  it('should return the health configure in user is', async () => {
    await authenticatedRequest
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          devices: [
            {
              features: [
                {
                  category: 'health',
                  id: '5smd05fc-1736-4b76-99ca-5812329sm036',
                  last_value: null,
                  last_value_string: '10',
                  name: 'Test withings',
                  read_only: false,
                  selector: 'test-withings-image',
                  type: 'weight',
                  unit: null,
                },
              ],
              id: 'cfsmb47f-4d25-4381-8923-2633b23192sm',
              name: 'Test withings',
            },
          ],
          user: {
            id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
            name: 'John',
          },
        });
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
