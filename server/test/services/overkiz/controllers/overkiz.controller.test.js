const { assert, fake, stub } = require('sinon');
const OverkizController = require('../../../../services/overkiz/api/overkiz.controller');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

const overkizService = {
  config: stub(),
  cleanUp: stub(),
  enableCalendar: stub(),
  disableCalendar: stub(),
  syncUserCalendars: stub(),
};

const res = {
  json: fake.returns(null),
  status: fake.returns({
    send: fake.returns(null),
  }),
};

describe('get /api/v1/service/overkiz/config', () => {
  it('should return new config', async () => {
    const overkizController = OverkizController(overkizService);
    const req = {
      user: {
        id: userId,
      },
    };
    await overkizController['get /api/v1/service/overkiz/config'].controller(req, res);
    assert.calledWith(overkizService.config, userId);
  });
});

describe('get /api/v1/service/overkiz/cleanup', () => {
  it('should cleanup overkiz data', async () => {
    const overkizController = OverkizController(overkizService);
    const req = {
      user: {
        id: userId,
      },
    };
    await overkizController['get /api/v1/service/overkiz/cleanup'].controller(req, res);
    assert.calledWith(overkizService.cleanUp, userId);
  });
});

describe('get /api/v1/service/overkiz/sync', () => {
  it('should sync', async () => {
    overkizService.syncUserCalendars.resolves({});
    const overkizController = OverkizController(overkizService);
    const req = {
      user: {
        id: userId,
      },
    };
    await overkizController['get /api/v1/service/overkiz/sync'].controller(req, res);
    assert.calledWith(overkizService.syncUserCalendars, userId);
  });
});

describe('patch /api/v1/service/overkiz/enable', () => {
  it('should enable overkiz calendar synchronization', async () => {
    const overkizController = OverkizController(overkizService);
    const req = {
      body: {
        selector: 'personnal',
      },
    };
    await overkizController['patch /api/v1/service/overkiz/enable'].controller(req, res);
    assert.calledWith(overkizService.enableCalendar, 'personnal');
  });
});

describe('patch /api/v1/service/overkiz/disable', () => {
  it('should disable overkiz calendar synchronization', async () => {
    const overkizController = OverkizController(overkizService);
    const req = {
      body: {
        selector: 'personnal',
      },
    };
    await overkizController['patch /api/v1/service/overkiz/disable'].controller(req, res);
    assert.calledWith(overkizService.disableCalendar, 'personnal');
  });
});
