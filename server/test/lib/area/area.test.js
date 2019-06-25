const { expect, assert } = require('chai');

const Area = require('../../../lib/area');

describe('area.create', () => {
  const area = new Area();
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
  });
});

describe('area.update', () => {
  const area = new Area();
  it('should update a area', async () => {
    const newArea = await area.update('test-area', {
      name: 'New name',
    });
    expect(newArea).to.have.property('name', 'New name');
    expect(newArea).to.have.property('selector', 'test-area');
  });
  it('should return area not found', async () => {
    const promise = area.update('not-found-area', {
      name: 'New name',
    });
    return assert.isRejected(promise, 'Area not found');
  });
});

describe('area.destroy', () => {
  const area = new Area();
  it('should destroy a area', async () => {
    await area.destroy('test-area');
  });
  it('should return area not found', async () => {
    const promise = area.destroy('not-found-area');
    return assert.isRejected(promise, 'Area not found');
  });
});

describe('area.get', () => {
  const area = new Area();
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
