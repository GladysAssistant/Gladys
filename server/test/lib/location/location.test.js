const { expect, assert } = require('chai');

const Location = require('../../../lib/location');

describe('location.create', () => {
  const location = new Location();
  it('should save user location', async () => {
    const newLocation = await location.create('john', {
      latitude: 12,
      longitude: 12,
    });
    expect(newLocation).to.deep.equal({
      id: newLocation.id,
      latitude: 12,
      longitude: 12,
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      updated_at: newLocation.updated_at,
      created_at: newLocation.created_at,
    });
  });
  it('should return user not found', async () => {
    const promise = location.create('user-not-found', {
      latitude: 12,
      longitude: 12,
    });
    assert.isRejected(promise, 'User not found');
  });
});

describe('location.get', () => {
  const location = new Location();
  it('should get location', async () => {
    const locations = await location.get('john', '2018-04-02 04:41:09', '2019-04-02 04:41:09');
    locations.forEach((oneLocation) => {
      expect(oneLocation).to.have.property('latitude');
      expect(oneLocation).to.have.property('longitude');
      expect(oneLocation).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
    });
  });
  it('should return user not found', async () => {
    const promise = location.get('user-not-found', '2018-04-02 04:41:09', '2019-04-02 04:41:09');
    assert.isRejected(promise, 'User not found');
  });
});

describe('location.getLast', () => {
  const location = new Location();
  it('should get last location of a user', async () => {
    const oneLocation = await location.getLast('john');
    expect(oneLocation).to.have.property('latitude');
    expect(oneLocation).to.have.property('longitude');
    expect(oneLocation).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
  });
  it('should return user not found', async () => {
    const promise = location.getLast('user-not-found');
    return assert.isRejected(promise, 'User not found');
  });
  it('should return no location found', async () => {
    const promise = location.getLast('pepper');
    return assert.isRejected(promise, 'User does not have any location yet.');
  });
});
