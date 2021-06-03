const { expect, assert } = require('chai');
const EventEmitter = require('events');

const event = new EventEmitter();

const Area = require('../../../lib/area');

describe('area.create', () => {
  const area = new Area(event);
  it('should create a area', async () => {
    const newArea = await area.create({
      name: 'My test area',
      latitude: 10,
      longitude: 10,
      radius: 200,
      color: '#00000',
    });
    expect(newArea).to.have.property('name', 'My test area');
    expect(newArea).to.have.property('selector', 'my-test-area');
    expect(newArea).to.have.property('latitude', 10);
    expect(area.areas).to.deep.equal([newArea]);
  });
});

describe('area.update', () => {
  const area = new Area(event);
  it('should update a area', async () => {
    const newArea = await area.update('test-area', {
      name: 'New name',
    });
    expect(newArea).to.have.property('name', 'New name');
    expect(newArea).to.have.property('selector', 'test-area');
    expect(area.areas).to.deep.equal([newArea]);
  });
  it('should update a area with value already in RAM', async () => {
    const newArea = await area.update('test-area', {
      name: 'New name 2',
    });
    expect(newArea).to.have.property('name', 'New name 2');
    expect(newArea).to.have.property('selector', 'test-area');
    expect(area.areas).to.deep.equal([newArea]);
  });
  it('should return area not found', async () => {
    const promise = area.update('not-found-area', {
      name: 'New name',
    });
    return assert.isRejected(promise, 'Area not found');
  });
});

describe('area.destroy', () => {
  const area = new Area(event);
  before(async () => {
    await area.init();
  });
  it('should destroy a area', async () => {
    await area.destroy('test-area');
    expect(area.areas).to.deep.equal([]);
  });
  it('should return area not found', async () => {
    const promise = area.destroy('not-found-area');
    return assert.isRejected(promise, 'Area not found');
  });
});

describe('area.get', () => {
  const area = new Area(event);
  it('should get list of areas', async () => {
    const areas = await area.get();
    areas.forEach((oneArea) => {
      expect(oneArea).to.have.property('id');
      expect(oneArea).to.have.property('name');
      expect(oneArea).to.have.property('latitude');
      expect(oneArea).to.have.property('longitude');
      expect(oneArea).to.have.property('radius');
      expect(oneArea).to.have.property('color');
    });
  });
});

describe('area.getBySelector', () => {
  const area = new Area(event);
  it('should get one area', async () => {
    const oneArea = await area.getBySelector('test-area');
    expect(oneArea).to.deep.equal({
      id: '939ff9b0-d349-483e-9a16-04e3ff03f1cd',
      name: 'Test area',
      selector: 'test-area',
      latitude: 10,
      longitude: 10,
      radius: 1000,
      color: '#0000',
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: new Date('2019-02-12T07:49:07.556Z'),
    });
  });
  it('should return area not found', async () => {
    const promise = area.getBySelector('unknown-area');
    return assert.isRejected(promise, 'Area not found');
  });
});
