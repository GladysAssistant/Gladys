const { assert, expect } = require('chai');

const User = require('../../../lib/user');
const Session = require('../../../lib/session');

describe('user.getPicture', () => {
  const session = new Session('secret');
  const user = new User(session);
  it('should get user', async () => {
    const picture = await user.getPicture('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    expect(picture).to.equal(
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALCwsMCxAMDBAXDw0PFxoUEBAUGh4XFxcXFx4dFxoZGRoXHR0jJCYkIx0vLzIyLy9AQEBAQEBAQEBAQEBAQED/2wBDAREPDxETERUSEhUUERMRFBkUFRUUGSUZGRsZGSUvIh0dHR0iLyotJiYmLSo0NC8vNDRAQD5AQEBAQEBAQEBAQED/wAARCAAFAAUDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAeEAABBAEFAAAAAAAAAAAAAAASAAEDEQITFSExQf/EABUBAQEAAAAAAAAAAAAAAAAAAAME/8QAFxEAAwEAAAAAAAAAAAAAAAAAADGSk//aAAwDAQACEQMRAD8AjjvOpI7PMdRk1YkQSDzd134iIgpluaP/2Q==',
    );
  });
  it('should return error, user not found', async () => {
    const promise = user.getPicture('949735af-cdc5-4ae3-b756-092d174a4092');
    return assert.isRejected(promise, 'User not found');
  });
});
