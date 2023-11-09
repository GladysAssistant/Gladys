const { expect } = require('chai');
const assertChai = require('chai').assert;
const sinon = require('sinon');

const User = require('../../../lib/user');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const StateManager = require('../../../lib/state');
const House = require('../../../lib/house');
const Session = require('../../../lib/session');

const event = {
  emit: fake.returns(null),
};

describe('House', () => {
  afterEach(() => {
    sinon.reset();
  });

  describe('house.create', () => {
    const house = new House(event);
    it('should create a house', async () => {
      const newHouse = await house.create({
        name: 'My test house',
      });
      expect(newHouse).to.have.property('name', 'My test house');
      expect(newHouse).to.have.property('selector', 'my-test-house');
      assert.calledWith(event.emit, EVENTS.HOUSE.CREATED);
    });
    it('should not create a house (name is empty)', async () => {
      const promise = house.create({
        name: '',
      });
      return assertChai.isRejected(promise);
    });
    it('should not create a house (name is too long)', async () => {
      const promise = house.create({
        name: 'this-is-a-long-long-name-this-is-a-long-long-name-this-is-a-long-long-name',
      });
      return assertChai.isRejected(promise);
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
      assert.calledWith(event.emit, EVENTS.HOUSE.UPDATED);
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
      assert.calledWith(event.emit, EVENTS.HOUSE.DELETED);
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
          alarm_code: null,
          alarm_delay_before_arming: 10,
          alarm_mode: 'disarmed',
          latitude: null,
          longitude: null,
          created_at: new Date('2019-02-12T07:49:07.556Z'),
          updated_at: new Date('2019-02-12T07:49:07.556Z'),
        },
        {
          id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
          name: 'Test house',
          selector: 'test-house',
          alarm_code: null,
          alarm_delay_before_arming: 10,
          alarm_mode: 'disarmed',
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

  describe('house.getUsersAtHome', () => {
    const house = new House(event);
    const state = new StateManager();
    const session = new Session('secret');
    const user = new User(session, state);
    it('should get users in an empty house', async () => {
      const users = await house.getUsersAtHome('test-house');
      expect(users).to.deep.equal([]);
    });
    it('should get users in a house', async () => {
      await user.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
        current_house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
      });
      const users = await house.getUsersAtHome('test-house');
      expect(users).to.deep.equal([
        {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          firstname: 'John',
          lastname: 'Doe',
          selector: 'john',
          picture:
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALCwsMCxAMDBAXDw0PFxoUEBAUGh4XFxcXFx4dFxoZGRoXHR0jJCYkIx0vLzIyLy9AQEBAQEBAQEBAQEBAQED/2wBDAREPDxETERUSEhUUERMRFBkUFRUUGSUZGRsZGSUvIh0dHR0iLyotJiYmLSo0NC8vNDRAQD5AQEBAQEBAQEBAQED/wAARCAAFAAUDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAeEAABBAEFAAAAAAAAAAAAAAASAAEDEQITFSExQf/EABUBAQEAAAAAAAAAAAAAAAAAAAME/8QAFxEAAwEAAAAAAAAAAAAAAAAAADGSk//aAAwDAQACEQMRAD8AjjvOpI7PMdRk1YkQSDzd134iIgpluaP/2Q==',
        },
      ]);
    });
    it('should return not found', async () => {
      const promise = house.getUsersAtHome('house-not-found');
      return assertChai.isRejected(promise, 'House not found');
    });
  });

  describe('house.isEmpty', () => {
    const house = new House(event);
    const state = new StateManager();
    const session = new Session('secret');
    const user = new User(session, state);
    it('should return true', async () => {
      const houseEmpty = await house.isEmpty('test-house');
      expect(houseEmpty).to.equal(true);
    });
    it('should return false', async () => {
      await user.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
        current_house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
      });
      const houseEmpty = await house.isEmpty('test-house');
      expect(houseEmpty).to.equal(false);
    });
    it('should return not found', async () => {
      const promise = house.getUsersAtHome('house-not-found');
      return assertChai.isRejected(promise, 'House not found');
    });
  });

  describe('house.userSeen', () => {
    const state = new StateManager();
    const house = new House(event, state);
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
      assert.calledWith(event.emit, EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.USER_PRESENCE.BACK_HOME,
        house: 'test-house',
        user: 'john',
      });
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.BACK_HOME,
        payload: user,
      });
      assert.calledWith(event.emit, EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.HOUSE.NO_LONGER_EMPTY,
        house: 'test-house',
      });
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

  describe('house.userLeft', () => {
    it('should mark user as left the house', async () => {
      const userLeftEvent = {
        emit: fake.returns(null),
      };
      const state = new StateManager();
      const house = new House(userLeftEvent, state);
      await house.userSeen('test-house', 'john');
      const user = await house.userLeft('test-house', 'john');
      expect(user).to.deep.equal({
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        firstname: 'John',
        lastname: 'Doe',
        selector: 'john',
        email: 'demo@demo.com',
        current_house_id: null,
        last_house_changed: user.last_house_changed,
        updated_at: user.updated_at,
      });
      assert.calledWith(userLeftEvent.emit, EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.USER_PRESENCE.LEFT_HOME,
        house: 'test-house',
        user: 'john',
      });
      assert.calledWith(userLeftEvent.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.LEFT_HOME,
        payload: user,
      });
      assert.calledWith(userLeftEvent.emit, EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.HOUSE.EMPTY,
        house: 'test-house',
      });
    });
    it('should not change anything', async () => {
      const userLeftEvent = {
        emit: fake.returns(null),
      };
      const state = new StateManager();
      const house = new House(userLeftEvent, state);
      const user = await house.userLeft('test-house', 'john');
      expect(user).to.deep.equal({
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        firstname: 'John',
        lastname: 'Doe',
        selector: 'john',
        email: 'demo@demo.com',
        current_house_id: null,
        last_house_changed: null,
      });
      assert.notCalled(userLeftEvent.emit);
    });
    it('should return house not found', async () => {
      const userLeftEvent = {
        emit: fake.returns(null),
      };
      const state = new StateManager();
      const house = new House(userLeftEvent, state);
      const promise = house.userLeft('house-not-found', 'john');
      return assertChai.isRejected(promise, 'House not found');
    });
    it('should return user not found', async () => {
      const userLeftEvent = {
        emit: fake.returns(null),
      };
      const state = new StateManager();
      const house = new House(userLeftEvent, state);
      const promise = house.userLeft('test-house', 'user-not-found');
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
        alarm_code: null,
        alarm_delay_before_arming: 10,
        alarm_mode: 'disarmed',
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
});
