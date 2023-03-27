const { expect } = require('chai');
const assertChai = require('chai').assert;
const { assert, fake } = require('sinon');

const Room = require('../../../lib/room');

describe('room.create', () => {
  const brain = {
    addNamedEntity: fake.returns(null),
    removeNamedEntity: fake.returns(null),
  };
  const room = new Room(brain);
  it('should create a room', async () => {
    const newRoom = await room.create('test-house', {
      name: 'My test room',
    });
    expect(newRoom).to.have.property('name', 'My test room');
    expect(newRoom).to.have.property('selector', 'my-test-room');
    assert.calledOnce(brain.addNamedEntity);
  });
  it('should not create a room (empty name)', async () => {
    const promise = room.create('test-house', {
      name: '',
    });
    return assertChai.isRejected(promise);
  });
  it('should not create a room (name too long)', async () => {
    const promise = room.create('test-house', {
      name: 'this-is-a-long-long-name-this-is-a-long-long-name-this-is-a-long-long-name',
    });
    return assertChai.isRejected(promise);
  });
  it('should return house not found', async () => {
    const promise = room.create('house-does-not-exist', {
      name: 'My test room',
    });
    return assertChai.isRejected(promise, 'House not found');
  });
});

describe('room.update', () => {
  const brain = {
    addNamedEntity: fake.returns(null),
    removeNamedEntity: fake.returns(null),
  };
  const room = new Room(brain);
  it('should update a room', async () => {
    const newRoom = await room.update('test-room', {
      name: 'New name',
    });
    expect(newRoom).to.have.property('name', 'New name');
    expect(newRoom).to.have.property('selector', 'test-room');
    assert.calledOnce(brain.removeNamedEntity);
    assert.calledOnce(brain.addNamedEntity);
  });
  it('should return room not found', async () => {
    const promise = room.update('room-does-not-exist', {
      name: 'My test room',
    });
    return assertChai.isRejected(promise, 'Room not found');
  });
});

describe('room.destroy', () => {
  const brain = {
    addNamedEntity: fake.returns(null),
    removeNamedEntity: fake.returns(null),
  };
  const room = new Room(brain);
  it('should destroy a room', async () => {
    await room.destroy('test-room');
    assert.calledOnce(brain.removeNamedEntity);
  });
  it('should return room not found', async () => {
    const promise = room.destroy('room-does-not-exist');
    return assertChai.isRejected(promise, 'Room not found');
  });
});

describe('room.getBySelector', () => {
  const brain = {
    addNamedEntity: fake.returns(null),
    removeNamedEntity: fake.returns(null),
  };
  const room = new Room(brain);
  it('should get a room by selector', async () => {
    const roomFound = await room.getBySelector('test-room');
    expect(roomFound).to.deep.equal({
      id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
      name: 'Test room',
      selector: 'test-room',
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: new Date('2019-02-12T07:49:07.556Z'),
    });
  });
  it('should get a room by selector with devices', async () => {
    const roomFound = await room.getBySelector('test-room', {
      expand: ['devices'],
    });
    expect(roomFound).to.deep.equal({
      id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
      name: 'Test room',
      selector: 'test-room',
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: new Date('2019-02-12T07:49:07.556Z'),
      devices: roomFound.devices,
    });
    roomFound.devices.forEach((device) => {
      expect(device).to.have.property('name');
      expect(device).to.have.property('selector');
      expect(device).to.have.property('features');
      expect(device).to.have.property('service');
      expect(device.service).to.have.property('name');
    });
  });
  it('should return room not found', async () => {
    const promise = room.getBySelector('Room does not exist');
    return assertChai.isRejected(promise, 'Room not found');
  });
});

describe('room.getAll', () => {
  const brain = {
    addNamedEntity: fake.returns(null),
    removeNamedEntity: fake.returns(null),
  };
  const room = new Room(brain);
  it('should get all rooms', async () => {
    const rooms = await room.getAll();
    expect(rooms).to.be.instanceOf(Array);
    rooms.forEach((oneRoom) => {
      expect(oneRoom).to.have.property('name');
    });
  });
});

describe('room.get', () => {
  const brain = {
    addNamedEntity: fake.returns(null),
    removeNamedEntity: fake.returns(null),
  };
  const room = new Room(brain);
  it('should get rooms with expanded devices + features', async () => {
    const rooms = await room.get({
      expand: ['devices'],
      take: 100,
    });
    expect(rooms).to.be.instanceOf(Array);
    rooms.forEach((oneRoom) => {
      expect(oneRoom).to.have.property('name');
      expect(oneRoom).to.have.property('devices');
      oneRoom.devices.forEach((oneDevice) => {
        expect(oneDevice).to.have.property('name');
        expect(oneDevice).to.have.property('selector');
        expect(oneDevice).to.have.property('features');
        expect(oneDevice).to.have.property('service');
        expect(oneDevice.service).to.have.property('name');
        expect(oneDevice).not.to.have.property('id');
        expect(oneDevice).not.to.have.property('room_id');
        expect(oneDevice).not.to.have.property('created_at');
        expect(oneDevice).not.to.have.property('updated_at');
        oneDevice.features.forEach((oneFeature) => {
          expect(oneFeature).to.have.property('last_value');
          expect(oneFeature).to.have.property('last_value_changed');
          expect(oneFeature).to.have.property('type');
          expect(oneFeature).to.have.property('unit');
          expect(oneFeature).to.have.property('min');
          expect(oneFeature).to.have.property('max');
          expect(oneFeature).not.to.have.property('id');
          expect(oneFeature).not.to.have.property('device_id');
          expect(oneFeature).not.to.have.property('created_at');
          expect(oneFeature).not.to.have.property('updated_at');
        });
      });
    });
  });
  it('should get 0 rooms (take = 0)', async () => {
    const rooms = await room.get({
      expand: ['devices'],
      take: 0,
    });
    expect(rooms).to.be.instanceOf(Array);
    expect(rooms).to.have.lengthOf(0);
  });
});
