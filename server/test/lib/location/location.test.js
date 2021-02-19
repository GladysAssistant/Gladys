const { expect, assert } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const Location = require('../../../lib/location');
const User = require('../../../lib/user');

const event = new EventEmitter();

describe('location.create', () => {
  const location = new Location({}, event);
  const user = new User();
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
  // this test was added because we add a performance problem with this function.
  // The test is kept so that there is no regression on this function
  it('should insert 100 locations in parallel and get user by id at the same time', async function Test() {
    this.timeout(30000);
    const promises = [];
    for (let i = 0; i < 100; i += 1) {
      promises.push(user.getById('0cd30aef-9c4e-4a23-88e3-3547971296e5'));
      promises.push(
        location.create('john', {
          latitude: 12,
          longitude: 12,
        }),
      );
    }
    await Promise.all(promises);
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
  const location = new Location({}, event);
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
  const location = new Location({}, event);
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

describe('location.handleNewGatewayOwntracksLocation', () => {
  it('should create location', async () => {
    const location = new Location(
      {
        getById: fake.resolves({
          selector: 'john',
        }),
      },
      event,
    );
    const data = {
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      latitude: 42,
      longitude: 42,
      altitude: 10,
    };
    const oneLocation = await location.handleNewGatewayOwntracksLocation(data);
    expect(oneLocation).to.have.property('latitude');
    expect(oneLocation).to.have.property('longitude');
    expect(oneLocation).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
  });
  it('should return user not found', async () => {
    const location = new Location(
      {
        getById: fake.rejects(null),
      },
      event,
    );
    const data = {
      user_id: 'not-found',
      latitude: 42,
      longitude: 42,
      altitude: 10,
    };
    const promise = location.handleNewGatewayOwntracksLocation(data);
    return assert.isRejected(promise);
  });
  it('should return bad parameters error', async () => {
    const location = new Location(
      {
        getById: fake.resolves({
          selector: 'john',
        }),
      },
      event,
    );
    const promise = location.handleNewGatewayOwntracksLocation(null);
    return assert.isRejected(promise);
  });
});
