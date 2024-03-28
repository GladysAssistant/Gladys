const sinon = require('sinon');
const eWeLinkController = require('../../../../services/ewelink/api/ewelink.controller');
const { EWELINK_APP_ID, EWELINK_APP_SECRET, EWELINK_APP_REGION } = require('../lib/constants');

const { assert, fake } = sinon;

const status = { configured: true, connected: true };
const configuration = {
  applicationId: EWELINK_APP_ID,
  applicationSecret: EWELINK_APP_SECRET,
  applicationRegion: EWELINK_APP_REGION,
};
const devices = [];

const ewelinkHandler = {
  configuration,
  discover: fake.resolves(devices),
  getStatus: fake.returns(status),
  saveConfiguration: fake.resolves(null),
  buildLoginUrl: fake.resolves('LOGIN_URL'),
  exchangeToken: fake.resolves(null),
  deleteTokens: fake.resolves(null),
};

describe('eWeLinkController GET /api/v1/service/ewelink/config', () => {
  let controller;

  beforeEach(() => {
    controller = eWeLinkController(ewelinkHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return config', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/ewelink/config'].controller(req, res);
    assert.calledOnceWithExactly(res.json, {
      application_id: EWELINK_APP_ID,
      application_secret: EWELINK_APP_SECRET,
      application_region: EWELINK_APP_REGION,
    });
  });
});

describe('eWeLinkController POST /api/v1/service/ewelink/config', () => {
  let controller;

  beforeEach(() => {
    controller = eWeLinkController(ewelinkHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save and return config', async () => {
    const req = {
      body: {
        application_id: 'NEW_APP_ID',
        application_secret: 'NEW_APP_SECRET',
        application_region: 'NEW_APP_REGION',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/ewelink/config'].controller(req, res);
    assert.calledOnceWithExactly(ewelinkHandler.saveConfiguration, {
      applicationId: 'NEW_APP_ID',
      applicationSecret: 'NEW_APP_SECRET',
      applicationRegion: 'NEW_APP_REGION',
    });
    assert.calledOnceWithExactly(res.json, {
      application_id: EWELINK_APP_ID,
      application_secret: EWELINK_APP_SECRET,
      application_region: EWELINK_APP_REGION,
    });
  });
});

describe('eWeLinkController GET /api/v1/service/ewelink/loginUrl', () => {
  let controller;

  beforeEach(() => {
    controller = eWeLinkController(ewelinkHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return login URL', async () => {
    const req = {
      query: {
        redirect_url: 'REDIRECT_URL',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/ewelink/loginUrl'].controller(req, res);
    assert.calledOnceWithExactly(ewelinkHandler.buildLoginUrl, { redirectUrl: 'REDIRECT_URL' });
    assert.calledOnceWithExactly(res.json, {
      login_url: 'LOGIN_URL',
    });
  });
});

describe('eWeLinkController POST /api/v1/service/ewelink/token', () => {
  let controller;

  beforeEach(() => {
    controller = eWeLinkController(ewelinkHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should exchange auth_code by user token', async () => {
    const req = {
      body: {
        redirect_url: 'REDIRECT_URL',
        code: 'AUTH_CODE',
        region: EWELINK_APP_REGION,
        state: 'LOGIN_STATE',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/ewelink/token'].controller(req, res);
    assert.calledOnceWithExactly(ewelinkHandler.exchangeToken, {
      redirectUrl: 'REDIRECT_URL',
      code: 'AUTH_CODE',
      region: EWELINK_APP_REGION,
      state: 'LOGIN_STATE',
    });
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });
});

describe('eWeLinkController DELETE /api/v1/service/ewelink/token', () => {
  let controller;

  beforeEach(() => {
    controller = eWeLinkController(ewelinkHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should delete stored tokens', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['delete /api/v1/service/ewelink/token'].controller(req, res);
    assert.calledOnceWithExactly(ewelinkHandler.deleteTokens);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });
});

describe('eWeLinkController GET /api/v1/service/ewelink/status', () => {
  let controller;

  beforeEach(() => {
    controller = eWeLinkController(ewelinkHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/ewelink/status'].controller(req, res);
    assert.calledOnceWithExactly(ewelinkHandler.getStatus);
    assert.calledOnceWithExactly(res.json, status);
  });
});

describe('eWeLinkController GET /api/v1/service/ewelink/discover', () => {
  let controller;

  beforeEach(() => {
    controller = eWeLinkController(ewelinkHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get devices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/ewelink/discover'].controller(req, res);
    assert.calledOnceWithExactly(ewelinkHandler.discover);
    assert.calledOnceWithExactly(res.json, devices);
  });
});
