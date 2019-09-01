const { expect } = require('chai');
const { transformHouse } = require('../../../../services/smartthings/utils/transformHouse');

describe('Transform Gladys house onto SmartThings location', () => {
  it('Test transformation', () => {
    const house = {
      id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
      name: 'Test house',
      latitude: 12,
      longitude: 13,
      selector: 'test-house',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    };
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      selector: 'john',
      email: 'demo@demo.com',
      password: '$2a$10$jsgdfTRYM4r5ainVwZdRsus44xtLYZn/mWhyBY2ch005MO15BS62u', // mysuperpassword
      language: 'en',
      picture:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALCwsMCxAMDBAXDw0PFxoUEBAUGh4XFxcXFx4dFxoZGRoXHR0jJCYkIx0vLzIyLy9AQEBAQEBAQEBAQEBAQED/2wBDAREPDxETERUSEhUUERMRFBkUFRUUGSUZGRsZGSUvIh0dHR0iLyotJiYmLSo0NC8vNDRAQD5AQEBAQEBAQEBAQED/wAARCAAFAAUDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAeEAABBAEFAAAAAAAAAAAAAAASAAEDEQITFSExQf/EABUBAQEAAAAAAAAAAAAAAAAAAAME/8QAFxEAAwEAAAAAAAAAAAAAAAAAADGSk//aAAwDAQACEQMRAD8AjjvOpI7PMdRk1YkQSDzd134iIgpluaP/2Q==',
      role: 'admin',
      birthdate: '12/12/1990',
      temperature_unit_preference: 'celsius',
      distance_unit_preference: 'metric',
      telegram_user_id: '555555555',
      created_at: '2019-02-12 07:49:07.556 +00:00',
      updated_at: '2019-02-12 07:49:07.556 +00:00',
    };
    const expected = {
      name: 'Test house',
      countryCode: 'FRA',
      latitude: 12,
      longitude: 13,
      temperatureScale: 'C',
      locale: 'en',
      additionalProperties: { gladysHouseId: 'a741dfa6-24de-4b46-afc7-370772f068d5' },
    };

    const result = transformHouse(house, user);
    expect(result).to.be.deep.eq(expected);
  });
});
