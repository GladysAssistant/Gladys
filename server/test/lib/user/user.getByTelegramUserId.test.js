const { assert, expect } = require('chai');

const User = require('../../../lib/user');

describe('user.getByTelegramUserId', () => {
  const user = new User();
  it('should return user', async () => {
    const userFound = await user.getByTelegramUserId('555555555');
    expect(userFound).to.deep.equal({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      selector: 'john',
      email: 'demo@demo.com',
      language: 'en',
      birthdate: '12/12/1990',
      temperature_unit_preference: 'celsius',
      distance_unit_preference: 'metric',
      role: 'admin',
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: new Date('2019-02-12T07:49:07.556Z'),
    });
  });
  it('should throw notFound error', async () => {
    const promise = user.getByTelegramUserId('THISDOESNOTEXIST');
    return assert.isRejected(promise, 'User with telegram_user_id "THISDOESNOTEXIST" not found');
  });
});
