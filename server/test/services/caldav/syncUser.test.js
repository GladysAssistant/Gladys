const { expect } = require('chai');
const sinon = require('sinon');
const { syncUser } = require('../../../services/caldav/lib/calendar/calendar.syncUser');

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

describe('CalDAV sync user', () => {
  const sync = {
    serviceId,
    syncUser,
    connect: sinon.stub().resolves({ calendars }),
    syncCalendars: sinon
      .stub()
      .withArgs(calendars)
      .resolves(),
    syncCalendarEvents: sinon.stub().resolves(),
    gladys: {
      calendar: {
        get: sinon
          .stub()
          .withArgs(userId)
          .resolves(gladysCalendars),
        destroy: sinon.stub().resolves(),
      },
    },
  };

  it('should start user sync', async () => {
    await sync.syncUser(userId);

    expect(sync.gladys.calendar.destroy.callCount).to.equal(3);
    expect(sync.gladys.calendar.destroy.args).to.eql([['perso'], ['stark-industries'], ['avengers']]);

    expect(sync.syncCalendars.args).to.eql([[calendars, userId]]);

    expect(sync.syncCalendarEvents.callCount).to.equal(3);

    expect(sync.syncCalendarEvents.args).to.eql([
      [gladysCalendars[0], [calendars[0]]],
      [gladysCalendars[2], [calendars[1]]],
      [gladysCalendars[3], [calendars[2]]],
    ]);
  });
});
