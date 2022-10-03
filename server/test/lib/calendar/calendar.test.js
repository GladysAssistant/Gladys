const { expect, assert } = require('chai');
const { fake } = require('sinon');

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
  const service = {
    getLocalServiceByName: fake.resolves({
      id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    }),
  };
  const calendar = new Calendar(service);
  it('should get list of calendars I am allowed to see (public and private)', async () => {
    const calendars = await calendar.get('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      externalId: '750db5b7-233b-41d1-89eb-d3aa4e959295',
    });

    calendars.forEach((oneCalendar) => {
      expect(oneCalendar).to.have.property('id');
      expect(oneCalendar).to.have.property('name');
      expect(oneCalendar).to.have.property('selector');
      expect(oneCalendar).to.have.property('external_id');
      expect(oneCalendar).to.have.property('sync');
      expect(oneCalendar).to.have.property('notify');
    });

    expect(calendars).to.eql([
      {
        id: '07ec2599-3221-4d6c-ac56-41443973201b',
        user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        shared: true,
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Test Calendar',
        selector: 'test-calendar',
        external_id: '750db5b7-233b-41d1-89eb-d3aa4e959295',
        description: 'Test calendar',
        color: '#6c235f',
        sync: true,
        notify: false,
        ctag: null,
        sync_token: null,
        last_sync: new Date('2019-02-12T07:49:07.556Z'),
        type: 'CALDAV',
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });

  it('should get list of calendars with only public ones', async () => {
    const calendars = await calendar.get('7a137a56-069e-4996-8816-36558174b727', {
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      shared: true,
    });

    calendars.forEach((oneCalendar) => {
      expect(oneCalendar).to.have.property('id');
      expect(oneCalendar).to.have.property('name');
      expect(oneCalendar).to.have.property('selector');
      expect(oneCalendar).to.have.property('external_id');
      expect(oneCalendar).to.have.property('sync');
      expect(oneCalendar).to.have.property('notify');
    });

    expect(calendars).to.eql([
      {
        id: '07ec2599-3221-4d6c-ac56-41443973201b',
        user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        shared: true,
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Test Calendar',
        selector: 'test-calendar',
        external_id: '750db5b7-233b-41d1-89eb-d3aa4e959295',
        description: 'Test calendar',
        color: '#6c235f',
        sync: true,
        notify: false,
        ctag: null,
        sync_token: null,
        last_sync: new Date('2019-02-12T07:49:07.556Z'),
        type: 'CALDAV',
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });

  it('should get list of calendars with only private ones', async () => {
    const calendars = await calendar.get('7a137a56-069e-4996-8816-36558174b727', {
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      shared: false,
    });

    calendars.forEach((oneCalendar) => {
      expect(oneCalendar).to.have.property('id');
      expect(oneCalendar).to.have.property('name');
      expect(oneCalendar).to.have.property('selector');
      expect(oneCalendar).to.have.property('external_id');
      expect(oneCalendar).to.have.property('sync');
      expect(oneCalendar).to.have.property('notify');
    });

    expect(calendars).to.eql([]);
  });

  it('should get list of calendars with sync enable & type CALDAV', async () => {
    const calendars = await calendar.get('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      sync: true,
      type: 'CALDAV',
    });

    calendars.forEach((oneCalendar) => {
      expect(oneCalendar).to.have.property('id');
      expect(oneCalendar).to.have.property('name');
      expect(oneCalendar).to.have.property('selector');
      expect(oneCalendar).to.have.property('external_id');
      expect(oneCalendar).to.have.property('sync');
      expect(oneCalendar).to.have.property('notify');
    });

    expect(calendars).to.eql([
      {
        id: '07ec2599-3221-4d6c-ac56-41443973201b',
        user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        shared: true,
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Test Calendar',
        selector: 'test-calendar',
        external_id: '750db5b7-233b-41d1-89eb-d3aa4e959295',
        description: 'Test calendar',
        color: '#6c235f',
        sync: true,
        notify: false,
        ctag: null,
        sync_token: null,
        last_sync: new Date('2019-02-12T07:49:07.556Z'),
        type: 'CALDAV',
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });

  it('should get a calendar from selector', async () => {
    const calendars = await calendar.get('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      serviceName: 'Service test',
      selector: 'test-calendar',
    });

    calendars.forEach((oneCalendar) => {
      expect(oneCalendar).to.have.property('id');
      expect(oneCalendar).to.have.property('name');
      expect(oneCalendar).to.have.property('selector');
    });

    expect(calendars).to.eql([
      {
        id: '07ec2599-3221-4d6c-ac56-41443973201b',
        user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        shared: true,
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Test Calendar',
        selector: 'test-calendar',
        external_id: '750db5b7-233b-41d1-89eb-d3aa4e959295',
        description: 'Test calendar',
        color: '#6c235f',
        sync: true,
        notify: false,
        ctag: null,
        sync_token: null,
        last_sync: new Date('2019-02-12T07:49:07.556Z'),
        type: 'CALDAV',
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
});
