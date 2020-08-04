const sinon = require('sinon');

const { fake, assert } = sinon;
const { cleanUp } = require('../../../../../services/caldav/lib/calendar/calendar.cleanUp');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

describe('Clean up CalDAV calendar', () => {
  const configEnv = {
    serviceId: 'bf2e17d1-19eb-4a6e-a602-63a0352736e7',
    cleanUp,
    gladys: {
      calendar: {
        get: fake.resolves([
          {
            id: 'd60ca4e5-3e91-4747-81e4-b397b21d70c5',
            selector: 'calendar-1',
          },
          {
            id: '586acdb4-6a52-4ee9-abf7-80dd2bb122c5',
            selector: 'calendar-2',
          },
        ]),
        destroy: fake.resolves({}),
      },
    },
  };

  beforeEach(() => {
    sinon.reset();
  });

  it('should clean up events and calendars', async () => {
    await configEnv.cleanUp(userId);

    assert.calledTwice(configEnv.gladys.calendar.destroy);
    assert.calledWith(configEnv.gladys.calendar.destroy, 'calendar-1');
    assert.calledWith(configEnv.gladys.calendar.destroy, 'calendar-2');
  });
});
