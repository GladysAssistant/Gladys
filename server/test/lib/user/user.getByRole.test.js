const { expect } = require('chai');

const User = require('../../../lib/user');

describe('user.getByRole', () => {
  const user = new User();
  it('should return list of user', async () => {
    const userFound = await user.getByRole('admin');
    expect(userFound[0]).to.deep.equal({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      selector: 'john',
      email: 'demo@demo.com',
      language: 'en',
    });
  });
});
