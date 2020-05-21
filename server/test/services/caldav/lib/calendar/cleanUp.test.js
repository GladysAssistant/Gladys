const { expect } = require('chai');
const sinon = require('sinon');
const { cleanUp } = require('../../../../../services/caldav/lib/calendar/calendar.cleanUp');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

describe('Clean up CalDAV calendar', () => {
  const configEnv = {
    serviceId: 'bf2e17d1-19eb-4a6e-a602-63a0352736e7',
    cleanUp,
    gladys: {
      calendar: {
        get: sinon.stub(),
        getEvents: sinon.stub(),
        destroy: sinon.stub(),
        destroyEvent: sinon.stub(),
      },
    },
  };

  it('should clean up events and calendars', async () => {
    configEnv.gladys.calendar.get.resolves([
      {
        id: 'd60ca4e5-3e91-4747-81e4-b397b21d70c5',
        selector: 'calendar-1',
      },
      {
        id: '586acdb4-6a52-4ee9-abf7-80dd2bb122c5',
        selector: 'calendar-2',
      },
    ]);
    configEnv.gladys.calendar.destroy.resolves({});

    await configEnv.cleanUp(userId);

    expect(configEnv.gladys.calendar.destroy.callCount).to.equal(2);
    expect(configEnv.gladys.calendar.destroy.args).to.have.deep.members([['calendar-1'], ['calendar-2']]);
  });
});
