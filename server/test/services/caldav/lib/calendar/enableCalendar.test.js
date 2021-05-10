const { expect } = require('chai');
const sinon = require('sinon');
const { enableCalendar } = require('../../../../../services/caldav/lib/calendar/calendar.enableCalendar');

describe('Enable CalDAV calendar', () => {
  const configEnv = {
    serviceId: 'bf2e17d1-19eb-4a6e-a602-63a0352736e7',
    enableCalendar,
    gladys: {
      calendar: {
        update: {},
      },
    },
  };

  it('should enable synchronization on a calendar', async () => {
    configEnv.gladys.calendar.update = sinon.stub();

    configEnv.gladys.calendar.update.resolves({
      id: 'd60ca4e5-3e91-4747-81e4-b397b21d70c5',
      selector: 'calendar-1',
      sync: true,
    });

    await configEnv.enableCalendar('calendar-1');

    expect(configEnv.gladys.calendar.update.callCount).to.equal(1);
    expect(configEnv.gladys.calendar.update.args).to.have.deep.members([['calendar-1', { sync: true }]]);
  });
});
