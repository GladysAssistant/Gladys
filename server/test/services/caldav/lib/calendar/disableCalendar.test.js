const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();
const { disableCalendar } = require('../../../../../services/caldav/lib/calendar/calendar.disableCalendar');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('Disable CalDAV calendar', () => {
  const configEnv = {
    serviceId: 'bf2e17d1-19eb-4a6e-a602-63a0352736e7',
    disableCalendar,
    gladys: {
      calendar: {
        update: {},
        get: {},
        destroyEvents: sinon.stub(),
      },
    },
  };

  it('should disable synchronization on a calendar', async () => {
    configEnv.gladys.calendar.update = sinon.stub();

    configEnv.gladys.calendar.update.resolves({
      id: 'd60ca4e5-3e91-4747-81e4-b397b21d70c5',
      selector: 'calendar-1',
      sync: false,
    });

    configEnv.gladys.calendar.get = sinon.stub().resolves([{ selector: 'calendar-1', user_id: USER_ID }]);

    await configEnv.disableCalendar('calendar-1', USER_ID);

    expect(configEnv.gladys.calendar.update.callCount).to.equal(1);
    expect(configEnv.gladys.calendar.update.args).to.have.deep.members([
      ['calendar-1', { sync: false, ctag: null, sync_token: null }],
    ]);
    expect(configEnv.gladys.calendar.destroyEvents.callCount).to.equal(1);
    expect(configEnv.gladys.calendar.destroyEvents.args).to.have.deep.members([
      ['d60ca4e5-3e91-4747-81e4-b397b21d70c5'],
    ]);
  });

  it('should refuse a calendar the user does not own', async () => {
    configEnv.gladys.calendar.update = sinon.stub();
    configEnv.gladys.calendar.destroyEvents = sinon.stub();
    // not a CalDAV calendar of this user (another user's, or another service's)
    configEnv.gladys.calendar.get = sinon.stub().resolves([]);

    await assert.isRejected(configEnv.disableCalendar('calendar-1', USER_ID), 'Calendar not found');
    expect(configEnv.gladys.calendar.update.callCount).to.equal(0);
    expect(configEnv.gladys.calendar.destroyEvents.callCount).to.equal(0);
  });
});
