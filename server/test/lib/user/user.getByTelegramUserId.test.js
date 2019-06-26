const { assert, expect } = require('chai');

const User = require('../../../lib/user');

describe('user.getByTelegramUserId', () => {
  const user = new User();
  it('should return user', async () => {
    const userFound = await user.getByTelegramUserId('555555555');
    expect(userFound).to.deep.equal({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      language: 'en',
    });
  });
  it('should throw notFound error', async () => {
    const promise = user.getByTelegramUserId('THISDOESNOTEXIST');
    return assert.isRejected(promise, 'User with telegram_user_id "THISDOESNOTEXIST" not found');
  });
});
