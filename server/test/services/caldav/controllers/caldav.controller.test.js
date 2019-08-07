const { assert, fake } = require('sinon');
const CaldavController = require('../../../../services/caldav/api/caldav.controller');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

const caldavService = {
  config: fake.resolves({ url: 'https://p01-caldav.icloud.com' }),
  sync: fake.resolves({}),
};

const res = {
  json: fake.returns(null),
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
    assert.calledWith(res.json, { url: 'https://p01-caldav.icloud.com' });
  });
});

describe('get /api/v1/service/caldav/sync', () => {
  it('should sync', async () => {
    const caldavController = CaldavController(caldavService);
    const req = {
      user: {
        id: userId,
      },
    };
    await caldavController['get /api/v1/service/caldav/sync'].controller(req, res);
    assert.calledWith(caldavService.sync, userId);
    assert.calledWith(res.json, {});
  });
});
