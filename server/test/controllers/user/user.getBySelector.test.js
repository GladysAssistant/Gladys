const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /api/v1/user/:user_selector', () => {
  it('should return a user by selector with selected fields', async () => {
    await authenticatedRequest
      .get('/api/v1/user/john')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          firstname: 'John',
          lastname: 'Doe',
          selector: 'john',
          email: 'demo@demo.com',
          birthdate: '12/12/1990',
          language: 'en',
          picture:
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALCwsMCxAMDBAXDw0PFxoUEBAUGh4XFxcXFx4dFxoZGRoXHR0jJCYkIx0vLzIyLy9AQEBAQEBAQEBAQEBAQED/2wBDAREPDxETERUSEhUUERMRFBkUFRUUGSUZGRsZGSUvIh0dHR0iLyotJiYmLSo0NC8vNDRAQD5AQEBAQEBAQEBAQED/wAARCAAFAAUDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAeEAABBAEFAAAAAAAAAAAAAAASAAEDEQITFSExQf/EABUBAQEAAAAAAAAAAAAAAAAAAAME/8QAFxEAAwEAAAAAAAAAAAAAAAAAADGSk//aAAwDAQACEQMRAD8AjjvOpI7PMdRk1YkQSDzd134iIgpluaP/2Q==',
          role: 'admin',
          temperature_unit_preference: 'celsius',
          distance_unit_preference: 'metric',
          last_latitude: null,
          last_longitude: null,
          last_altitude: null,
          last_accuracy: null,
          last_location_changed: null,
          current_house_id: null,
          last_house_changed: null,
          created_at: '2019-02-12T07:49:07.556Z',
          updated_at: '2019-02-12T07:49:07.556Z',
        });
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .get('/api/v1/user/USER_DOES_NOT_EXIST')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});
