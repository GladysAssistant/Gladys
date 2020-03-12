const { assert, fake, stub } = require('sinon');
const CaldavController = require('../../../../services/caldav/api/caldav.controller');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

const caldavService = {
  config: stub(),
  cleanUp: stub(),
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
    caldavService.config.resolves({ url: 'https://p01-caldav.icloud.com' });
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/config'].controller(req, res);
    assert.calledWith(caldavService.config, userId);
    assert.calledWith(res.status, 200);
  });

  it('should return fail config', async () => {
    caldavService.config.rejects({});
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/config'].controller(req, res);
    assert.calledWith(caldavService.config, userId);
    assert.calledWith(res.status, 500);
  });
});

describe('get /api/v1/service/caldav/cleanup', () => {
  it('should cleanup caldav data', async () => {
    caldavService.cleanUp.resolves({});
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/cleanup'].controller(req, res);
    assert.calledWith(caldavService.cleanUp, userId);
    assert.calledWith(res.status, 200);
  });

  it('should fail cleanup caldav data', async () => {
    caldavService.cleanUp.rejects({});
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/cleanup'].controller(req, res);
    assert.calledWith(caldavService.cleanUp, userId);
    assert.calledWith(res.status, 500);
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
    assert.calledWith(res.status, 200);
  });

  it('should fail sync', async () => {
    caldavService.syncUserCalendars.rejects({});
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/sync'].controller(req, res);
    assert.calledWith(caldavService.syncUserCalendars, userId);
    assert.calledWith(res.status, 500);
  });
});
