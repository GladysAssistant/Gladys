const { expect } = require('chai');
const sinon = require('sinon');
const { updateCalendars } = require('../../../../../services/caldav/lib/calendar/calendar.updateCalendars');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

const calendars = [{ name: 'Perso' }, { name: 'Stark Industries' }, { name: 'Avengers' }];

const formatedCalendars = [
  {
    external_id: 'https://caldav.tonystark.com/perso',
    name: 'Perso',
    description: 'My personal calendar',
    service_id: '5d6c666f-56be-4929-9104-718a78556844',
    user_id: userId,
  },
  {
    external_id: 'https://caldav.tonystark.com/stark-industries',
    name: 'Stark Industries',
    description: 'Stark Industries planning',
    service_id: '5d6c666f-56be-4929-9104-718a78556844',
    user_id: userId,
  },
  {
    external_id: 'https://caldav.tonystark.com/avengers',
    name: 'Avengers',
    description: 'Calendar Avengers',
    service_id: '5d6c666f-56be-4929-9104-718a78556844',
    user_id: userId,
  },
];

describe('CalDAV sync calendars', () => {
  const sync = {
    updateCalendars,
    formatCalendars: sinon.stub().returns(formatedCalendars),
    gladys: {
      calendar: {
        create: sinon.stub().resolves(),
      },
    },
  };

  it('should sync calendars', async () => {
    await sync.updateCalendars(calendars, userId);
    expect(sync.gladys.calendar.create.callCount).to.equal(3);
    expect(sync.gladys.calendar.create.args).to.eql([
      [formatedCalendars[0]],
      [formatedCalendars[1]],
      [formatedCalendars[2]],
    ]);
  });
});
