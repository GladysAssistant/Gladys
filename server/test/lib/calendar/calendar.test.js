const { expect, assert } = require('chai');

const Calendar = require('../../../lib/calendar');

describe('calendar.create', () => {
  const calendar = new Calendar();
  it('should create a calendar', async () => {
    const newCalendar = await calendar.create({
      name: 'My test calendar',
      description: 'This is a calendar',
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    expect(newCalendar).to.have.property('name', 'My test calendar');
    expect(newCalendar).to.have.property('selector', 'my-test-calendar');
    expect(newCalendar).to.have.property('description', 'This is a calendar');
  });
});

describe('calendar.update', () => {
  const calendar = new Calendar();
  it('should update a calendar', async () => {
    const newCalendar = await calendar.update('test-calendar', {
      name: 'New name',
    });
    expect(newCalendar).to.have.property('name', 'New name');
    expect(newCalendar).to.have.property('selector', 'test-calendar');
  });
  it('should return calendar not found', async () => {
    const promise = calendar.update('not-found-calendar', {
      name: 'New name',
    });
    return assert.isRejected(promise, 'Calendar not found');
  });
});

describe('calendar.destroy', () => {
  const calendar = new Calendar();
  it('should destroy a calendar', async () => {
    await calendar.destroy('test-calendar');
  });
  it('should return calendar not found', async () => {
    const promise = calendar.destroy('not-found-calendar');
    return assert.isRejected(promise, 'Calendar not found');
  });
});

describe('calendar.get', () => {
  const calendar = new Calendar();
  it('should get list of calendars', async () => {
    const calendars = await calendar.get('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    calendars.forEach((oneCalendar) => {
      expect(oneCalendar).to.have.property('id');
      expect(oneCalendar).to.have.property('name');
      expect(oneCalendar).to.have.property('selector');
      expect(oneCalendar).to.have.property('external_id');
      expect(oneCalendar).to.have.property('sync');
      expect(oneCalendar).to.have.property('notify');
    });
  });
});
