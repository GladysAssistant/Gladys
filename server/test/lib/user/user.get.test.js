const { expect } = require('chai');

const User = require('../../../lib/user');

describe('user.get', () => {
  const user = new User();
  it('should return list of users with their current_house', async () => {
    const users = await user.get({ expand: ['current_house'] });
    expect(users).to.deep.equal([
      {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        firstname: 'John',
        lastname: 'Doe',
        selector: 'john',
        email: 'demo@demo.com',
        current_house: null,
      },
      {
        id: '7a137a56-069e-4996-8816-36558174b727',
        firstname: 'Pepper',
        lastname: 'Pots',
        selector: 'pepper',
        email: 'pepper@pots.com',
        current_house: {
          id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
          name: 'Peppers house',
          selector: 'pepper-house',
          latitude: null,
          longitude: null,
          created_at: new Date('2019-02-12T07:49:07.556Z'),
          updated_at: new Date('2019-02-12T07:49:07.556Z'),
        },
      },
    ]);
  });
});
