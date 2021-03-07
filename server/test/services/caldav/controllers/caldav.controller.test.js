const { assert, fake, stub } = require('sinon');
const CaldavController = require('../../../../services/caldav/api/caldav.controller');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

const caldavService = {
  config: stub(),
  cleanUp: stub(),
  enableCalendar: stub(),
  syncUserCalendars: stub(),
};

const res = {
  json: fake.returns(null),
  status: fake.returns({
    send: fake.returns(null),
  }),
};

describe('get /api/v1/service/caldav/config', () => {
  it('should return new config', async () => {
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/config'].controller(req, res);
    assert.calledWith(caldavService.config, userId);
  });
});

describe('get /api/v1/service/caldav/cleanup', () => {
  it('should cleanup caldav data', async () => {
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/cleanup'].controller(req, res);
    assert.calledWith(caldavService.cleanUp, userId);
  });
});

describe('get /api/v1/service/caldav/sync', () => {
  it('should sync', async () => {
    caldavService.syncUserCalendars.resolves({});
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/sync'].controller(req, res);
    assert.calledWith(caldavService.syncUserCalendars, userId);
  });
});

describe('patch /api/v1/service/caldav/enable', () => {
  it('should disable caldav calendar synchronization', async () => {
    const caldavController = CaldavController(caldavService);
    const req = {
      body: {
        selector: 'personnal',
        sync: false,
      },
    };
    await caldavController['patch /api/v1/service/caldav/enable'].controller(req, res);
    assert.calledWith(caldavService.enableCalendar, 'personnal', false);
  });
});
