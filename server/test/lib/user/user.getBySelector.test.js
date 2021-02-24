const { assert, expect } = require('chai');

const EventEmitter = require('events');
const User = require('../../../lib/user');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const stateManager = new StateManager(event);
const Session = require('../../../lib/session');

describe('user.getBySelector', () => {
  const session = new Session('secret');
  const user = new User(session, stateManager);
  it('should return pepper', async () => {
    const result = await user.getBySelector('pepper');
    expect(result).to.deep.equal({
      id: '7a137a56-069e-4996-8816-36558174b727',
      firstname: 'Pepper',
      lastname: 'Pots',
      selector: 'pepper',
      email: 'pepper@pots.com',
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
      current_house_id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
      last_house_changed: new Date('2019-02-12T07:49:07.556Z'),
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: new Date('2019-02-12T07:49:07.556Z'),
    });
  });
  it('should destroy return not found', async () => {
    const promise = user.getBySelector('USER_NOT_FOUND');
    return assert.isRejected(promise, 'User not found');
  });
});
