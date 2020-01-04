const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const { syncUserCalendars } = require('../../../../../services/caldav/lib/calendar/calendar.syncUserCalendars');

chai.use(chaiAsPromised);
const { expect } = chai;

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';
const serviceId = '5d6c666f-56be-4929-9104-718a78556844';

const calendars = [
  { url: 'https://caldav.tonystark.com/perso' },
  { url: 'https://caldav.tonystark.com/stark-industries' },
  { url: 'https://caldav.tonystark.com/avengers' },
];

const gladysCalendars = [
  {
    service_id: serviceId,
    external_id: calendars[0].url,
    name: 'Perso',
    selector: 'perso',
  },
  {
    service_id: 'eb2f2d97-5fca-43d7-84d9-77d3ab2f7954',
    external_id: 'https://service-calendar.com',
    name: 'Other service calendar',
    selector: 'other-service-calendar',
  },
  {
    service_id: serviceId,
    external_id: calendars[1].url,
    name: 'Stark Industries',
    selector: 'stark-industries',
  },
  {
    service_id: serviceId,
    external_id: calendars[2].url,
    name: 'Avengers',
    selector: 'avengers',
  },
];

const gladysEvents = [
  {
    selector: 'event-1',
  },
  {
    selector: 'event-2',
  },
];

describe('CalDAV sync user', () => {
  const sync = {
    serviceId,
    syncUserCalendars,
    connect: sinon.stub().resolves({ calendars }),
    updateCalendars: sinon
      .stub()
      .withArgs(calendars)
      .resolves(),
    updateCalendarEvents: sinon.stub(),
    gladys: {
      calendar: {
        get: sinon
          .stub()
          .withArgs(userId)
          .resolves(gladysCalendars),
        destroy: sinon.stub().resolves(),
        getEvents: sinon
          .stub()
          .withArgs(userId)
          .resolves(gladysEvents),
        destroyEvent: sinon.stub().resolves(),
      },
    },
  };

  it('should start user sync', async () => {
    sync.updateCalendarEvents.resolves();
    await sync.syncUserCalendars(userId);

    expect(sync.gladys.calendar.destroy.callCount).to.equal(3);
    expect(sync.gladys.calendar.destroy.args).to.eql([['perso'], ['stark-industries'], ['avengers']]);
    expect(sync.gladys.calendar.destroyEvent.callCount).to.equal(6);
    expect(sync.gladys.calendar.destroyEvent.args).to.eql([
      ['event-1'],
      ['event-2'],
      ['event-1'],
      ['event-2'],
      ['event-1'],
      ['event-2'],
    ]);

    expect(sync.updateCalendars.args).to.eql([[calendars, userId]]);

    expect(sync.updateCalendarEvents.callCount).to.equal(3);

    expect(sync.updateCalendarEvents.args).to.eql([
      [gladysCalendars[0], [calendars[0]]],
      [gladysCalendars[2], [calendars[1]]],
      [gladysCalendars[3], [calendars[2]]],
    ]);
  });

  it('should fail start user sync', async () => {
    sync.updateCalendarEvents.rejects(Error('Fail sync calendar events'));
    expect(sync.syncUserCalendars(userId)).to.be.rejectedWith(Error, 'Fail sync calendar events');
  });
});
