const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');

describe('GET /api/v1/user', () => {
  it('should return list of user with last location', async () => {
    await authenticatedRequest
      .get('/api/v1/user')
      .query({
        fields: 'id,firstname,lastname,last_latitude,last_longitude,last_location_changed',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
            firstname: 'John',
            lastname: 'Doe',
            last_latitude: null,
            last_longitude: null,
            last_location_changed: null,
          },
          {
            id: '7a137a56-069e-4996-8816-36558174b727',
            firstname: 'Pepper',
            lastname: 'Pots',
            last_latitude: null,
            last_longitude: null,
            last_location_changed: null,
          },
        ]);
      });
  });
  it('should return list of user with current house', async () => {
    await authenticatedRequest
      .get('/api/v1/user')
      .query({
        fields: 'id',
        expand: 'current_house',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal([
          {
            id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
            current_house: null,
          },
          {
            id: '7a137a56-069e-4996-8816-36558174b727',
            current_house: {
              id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
              name: 'Peppers house',
              selector: 'pepper-house',
              alarm_code: null,
              alarm_delay_before_arming: 10,
              alarm_mode: 'disarmed',
              latitude: null,
              longitude: null,
              created_at: '2019-02-12T07:49:07.556Z',
              updated_at: '2019-02-12T07:49:07.556Z',
            },
          },
        ]);
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .get('/api/v1/user')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
