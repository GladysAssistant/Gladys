const { expect } = require('chai');
const assertChai = require('chai').assert;
const { fake, assert } = require('sinon');
const { EVENTS } = require('../../../utils/constants');

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.create', () => {
  const house = new House(event);
  it('should create a house', async () => {
    const newHouse = await house.create({
      name: 'My test house',
    });
    expect(newHouse).to.have.property('name', 'My test house');
    expect(newHouse).to.have.property('selector', 'my-test-house');
  });
});

describe('house.update', () => {
  const house = new House(event);
  it('should update a house', async () => {
    const updatedHouse = await house.update('test-house', {
      name: 'Updated house',
    });
    expect(updatedHouse).to.have.property('name', 'Updated house');
    expect(updatedHouse).to.have.property('selector', 'test-house');
  });
  it('should return not found', async () => {
    const promise = house.update('house-does-not-exist', {
      name: 'Updated house',
    });
    return assertChai.isRejected(promise, 'House not found');
  });
});

describe('house.destroy', () => {
  const house = new House(event);
  it('should delete a house', async () => {
    await house.destroy('test-house');
  });
  it('should return house not found', async () => {
    const promise = house.destroy('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
});

describe('house.get', () => {
  const house = new House(event);
  it('should get list of houses', async () => {
    const houses = await house.get();
    expect(houses).to.deep.equal([
      {
        id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
        name: 'Peppers house',
        selector: 'pepper-house',
        latitude: null,
        longitude: null,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
      {
        id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
        name: 'Test house',
        selector: 'test-house',
        latitude: 12,
        longitude: 12,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
  it('should get list of houses with rooms list', async () => {
    const houses = await house.get({ expand: ['rooms'] });
    houses.forEach((oneHouse) => {
      expect(oneHouse)
        .to.have.property('rooms')
        .and.to.be.instanceOf(Array);
    });
  });
});

describe('house.getRooms', () => {
  const house = new House(event);
  it('should get rooms in a house', async () => {
    const rooms = await house.getRooms('test-house');
    expect(rooms).to.deep.equal([
      {
        id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
        name: 'Test room',
        selector: 'test-room',
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
  it('should return not found', async () => {
    const promise = house.getRooms('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
});

describe('house.userSeen', () => {
  const house = new House(event);
  it('should mark user as present in this house', async () => {
    const user = await house.userSeen('test-house', 'john');
    expect(user).to.deep.equal({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      selector: 'john',
      email: 'demo@demo.com',
      current_house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
      last_house_changed: user.last_house_changed,
      updated_at: user.updated_at,
    });
    assert.calledWith(event.emit, EVENTS.USER_PRESENCE.BACK_HOME, user);
  });
  it('should emit user seen event', async () => {
    const user = await house.userSeen('pepper-house', 'pepper');
    expect(user).to.deep.equal({
      id: '7a137a56-069e-4996-8816-36558174b727',
      firstname: 'Pepper',
      lastname: 'Pots',
      selector: 'pepper',
      email: 'pepper@pots.com',
      current_house_id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
      last_house_changed: user.last_house_changed,
    });
    assert.calledWith(event.emit, EVENTS.USER_PRESENCE.SEEN_AT_HOME, user);
  });
  it('should return house not found', async () => {
    const promise = house.userSeen('house-not-found', 'john');
    return assertChai.isRejected(promise, 'House not found');
  });
  it('should return user not found', async () => {
    const promise = house.userSeen('test-house', 'user-not-found');
    return assertChai.isRejected(promise, 'User not found');
  });
});

describe('house.getBySelector', () => {
  const house = new House(event);
  it('should return a house', async () => {
    const testHouse = await house.getBySelector('test-house');
    expect(testHouse).to.deep.equal({
      id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
      name: 'Test house',
      selector: 'test-house',
      latitude: 12,
      longitude: 12,
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: new Date('2019-02-12T07:49:07.556Z'),
    });
  });
  it('should return not found', async () => {
    const promise = house.getBySelector('house-not-found');
    return assertChai.isRejected(promise, 'House not found');
  });
});
