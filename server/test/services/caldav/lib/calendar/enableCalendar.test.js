const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();
const { enableCalendar } = require('../../../../../services/caldav/lib/calendar/calendar.enableCalendar');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('Enable CalDAV calendar', () => {
  const configEnv = {
    serviceId: 'bf2e17d1-19eb-4a6e-a602-63a0352736e7',
    enableCalendar,
    gladys: {
      calendar: {
        update: {},
        get: {},
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

    configEnv.gladys.calendar.get = sinon.stub().resolves([{ selector: 'calendar-1', user_id: USER_ID }]);

    await configEnv.enableCalendar('calendar-1', USER_ID);

    expect(configEnv.gladys.calendar.get.args).to.deep.equal([
      [USER_ID, { selector: 'calendar-1', serviceId: 'bf2e17d1-19eb-4a6e-a602-63a0352736e7' }],
    ]);
    expect(configEnv.gladys.calendar.update.callCount).to.equal(1);
    expect(configEnv.gladys.calendar.update.args).to.have.deep.members([['calendar-1', { sync: true }]]);
  });

  it('should refuse a calendar the user does not own', async () => {
    configEnv.gladys.calendar.update = sinon.stub();
    // a calendar shared by another user is readable, not the requester's
    configEnv.gladys.calendar.get = sinon.stub().resolves([{ selector: 'calendar-1', user_id: 'another-user' }]);

    await assert.isRejected(configEnv.enableCalendar('calendar-1', USER_ID), 'Calendar not found');
    expect(configEnv.gladys.calendar.update.callCount).to.equal(0);
  });
});
