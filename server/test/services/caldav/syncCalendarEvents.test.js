const { expect } = require('chai');
const sinon = require('sinon');
const { syncCalendarEvents } = require('../../../services/caldav/lib/calendar/calendar.syncCalendarEvents');

const gladysCalendar = {
  name: 'Perso',
  selector: 'perso',
};

const calendars = [
  {
    objects: [
      {
        event: {
          type: 'VEVENT',
          uid: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
          summary: 'Event 1',
          start: new Date('2019-02-25T10:00:00Z'),
          end: new Date('2019-02-25T12:00:00Z'),
          location: 'Paris',
        },
      },
      {
        event: {
          type: 'VEVENT',
          uid: '71c01038-2231-4dee-a230-6820fdb1136e',
          summary: 'Event 2',
          start: new Date('2019-04-01T10:00:00Z'),
          location: 'Toulouse',
        },
      },
    ],
  },
];

const formatedEvents = [
  {
    external_id: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
    selector: 'Event 1 2019-02-25-1000',
    name: 'Event 1',
    location: 'Paris',
    start: '2019-02-25T10:00:00.000Z',
    end: '2019-02-25T12:00:00.000Z',
    calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
  },
  {
    external_id: '71c01038-2231-4dee-a230-6820fdb1136e',
    selector: 'Event 2 2019-04-01-1000',
    name: 'Event 2',
    location: 'Toulouse',
    start: '2019-04-01T10:00:00.000Z',
    full_day: true,
    calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
  },
];

describe('CalDAV sync calendars events', () => {
  const sync = {
    syncCalendarEvents,
    formatEvents: sinon.stub().returns(formatedEvents),
    gladys: {
      calendar: {
        createEvent: sinon.stub().resolves(),
      },
    },
  };

  it('should sync calendars', async () => {
    await sync.syncCalendarEvents(gladysCalendar, calendars);
    expect(sync.gladys.calendar.createEvent.callCount).to.equal(2);
    expect(sync.gladys.calendar.createEvent.args).to.eql([['perso', formatedEvents[0]], ['perso', formatedEvents[1]]]);
  });
});
