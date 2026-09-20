const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const ThermostatController = require('../../../../services/thermostat/api/thermostat.controller');

const setpointFeature = {
  selector: 'thermostat-living-room',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
};
const thermostatDevice = { selector: 'my-thermostat', features: [setpointFeature] };

const buildRes = () => {
  const res = {
    statusCode: null,
    body: null,
    json: fake((payload) => {
      res.body = payload;
      return res;
    }),
    status: fake((code) => {
      res.statusCode = code;
      return res;
    }),
  };
  return res;
};

const buildHandler = (overrides = {}) => ({
  getDevices: fake.resolves([thermostatDevice]),
  createDevice: fake.resolves({ selector: 'created' }),
  getSchedules: fake.resolves([{ selector: 'my-schedule' }]),
  getScheduleBySelector: fake.resolves({ selector: 'my-schedule' }),
  createSchedule: fake.resolves({ selector: 'new-schedule' }),
  attachScheduleToDevice: fake.resolves(null),
  detachScheduleFromDevice: fake.resolves(null),
  updateSchedule: fake.resolves({ selector: 'my-schedule' }),
  deleteSchedule: fake.resolves(null),
  broadcastConfigUpdated: fake.returns(null),
  triggerApplySchedules: fake.returns(null),
  ...overrides,
});

// Routes wrap their controller in asyncMiddleware, so go through it.
const callRoute = async (routes, route, req, res) => {
  await routes[route].controller(req, res, (err) => {
    if (err) {
      throw err;
    }
  });
};

describe('thermostat.controller', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should declare every route as authenticated', () => {
    const routes = ThermostatController(buildHandler());

    expect(Object.keys(routes)).to.have.lengthOf(9);
    Object.values(routes).forEach((route) => {
      expect(route.authenticated).to.equal(true);
    });
  });

  it('should return the thermostat devices with the search filters', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(
      routes,
      'get /api/v1/service/thermostat/device',
      { query: { search: 'salon', order_dir: 'desc' } },
      res,
    );

    assert.calledWith(handler.getDevices, { search: 'salon', order_dir: 'desc' });
    expect(res.body).to.deep.equal([thermostatDevice]);
  });

  it('should create a device', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(routes, 'post /api/v1/service/thermostat/device', { body: { name: 'Salon' } }, res);

    assert.calledWith(handler.createDevice, { name: 'Salon' });
    expect(res.body).to.deep.equal({ selector: 'created' });
  });

  it('should return the schedules', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(routes, 'get /api/v1/service/thermostat/schedule', { query: {} }, res);

    expect(res.body).to.deep.equal([{ selector: 'my-schedule' }]);
  });

  it('should filter the schedules on a house', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(routes, 'get /api/v1/service/thermostat/schedule', { query: { house: 'main-house' } }, res);

    assert.calledWith(handler.getSchedules, 'main-house');
  });

  it('should return one schedule by selector', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(
      routes,
      'get /api/v1/service/thermostat/schedule/:selector',
      { params: { selector: 'my-schedule' } },
      res,
    );

    expect(res.body).to.deep.equal({ selector: 'my-schedule' });
  });

  it('should create a schedule', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(
      routes,
      'post /api/v1/service/thermostat/schedule',
      { body: { house: 'main-house', name: 'Semaine' } },
      res,
    );

    // The house is a route-level argument, not part of the schedule payload.
    assert.calledWith(handler.createSchedule, 'main-house', { name: 'Semaine' });
    expect(res.body).to.deep.equal({ selector: 'new-schedule' });
  });

  it('should reject a create with no body as an invalid schedule', async () => {
    const handler = buildHandler({
      createSchedule: fake.rejects(new Error('Invalid thermostat schedule: "name" is required')),
    });
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(routes, 'post /api/v1/service/thermostat/schedule', {}, res);

    assert.calledWith(handler.createSchedule, undefined, {});
    expect(res.statusCode).to.equal(400);
  });

  it('should make a thermostat follow a schedule', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(
      routes,
      'put /api/v1/service/thermostat/schedule/:selector/device/:device_selector',
      { params: { selector: 'my-schedule', device_selector: 'living-room' } },
      res,
    );

    assert.calledWith(handler.attachScheduleToDevice, 'my-schedule', 'living-room');
    expect(res.body).to.deep.equal({ success: true });
  });

  it('should stop a thermostat from following a schedule', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(
      routes,
      'delete /api/v1/service/thermostat/schedule/:selector/device/:device_selector',
      { params: { selector: 'my-schedule', device_selector: 'living-room' } },
      res,
    );

    assert.calledWith(handler.detachScheduleFromDevice, 'my-schedule', 'living-room');
    expect(res.body).to.deep.equal({ success: true });
  });

  it('should report a schedule failure as its own status and code', async () => {
    const cases = [
      ['Schedule not found: x', 404, 'SCHEDULE_NOT_FOUND'],
      ['House not found: x', 404, 'HOUSE_NOT_FOUND'],
      ['A schedule with the name "Week" already exists', 409, 'SCHEDULE_NAME_ALREADY_EXISTS'],
      ['Invalid thermostat schedule: duplicate transition on day 0 at 07:00', 400, 'DUPLICATE_TRANSITION'],
      ['Invalid thermostat schedule: "name" is required', 400, 'INVALID_SCHEDULE'],
    ];

    await Promise.all(
      cases.map(async ([message, status, error]) => {
        const handler = buildHandler({ createSchedule: fake.rejects(new Error(message)) });
        const routes = ThermostatController(handler);
        const res = buildRes();

        await callRoute(routes, 'post /api/v1/service/thermostat/schedule', { body: {} }, res);

        expect(res.statusCode, message).to.equal(status);
        expect(res.body.error, message).to.equal(error);
      }),
    );
  });

  it('should report an attach failure as its own status and code', async () => {
    const cases = [
      ['Device not found: x', 404, 'DEVICE_NOT_FOUND'],
      ['Device is not a thermostat: x', 400, 'NOT_A_THERMOSTAT'],
      ['Device is not in the house of schedule "week": x', 400, 'DEVICE_NOT_IN_HOUSE'],
    ];

    await Promise.all(
      cases.map(async ([message, status, error]) => {
        const handler = buildHandler({ attachScheduleToDevice: fake.rejects(new Error(message)) });
        const routes = ThermostatController(handler);
        const res = buildRes();

        await callRoute(
          routes,
          'put /api/v1/service/thermostat/schedule/:selector/device/:device_selector',
          { params: { selector: 'week', device_selector: 'x' } },
          res,
        );

        expect(res.statusCode, message).to.equal(status);
        expect(res.body.error, message).to.equal(error);
      }),
    );
  });

  it('should report a failure on every schedule route by code', async () => {
    const routesUnderTest = [
      ['get /api/v1/service/thermostat/schedule/:selector', 'getScheduleBySelector', { params: { selector: 'x' } }],
      [
        'patch /api/v1/service/thermostat/schedule/:selector',
        'updateSchedule',
        { params: { selector: 'x' }, body: {} },
      ],
      ['delete /api/v1/service/thermostat/schedule/:selector', 'deleteSchedule', { params: { selector: 'x' } }],
      [
        'delete /api/v1/service/thermostat/schedule/:selector/device/:device_selector',
        'detachScheduleFromDevice',
        { params: { selector: 'x', device_selector: 'y' } },
      ],
    ];

    await Promise.all(
      routesUnderTest.map(async ([route, method, req]) => {
        const handler = buildHandler({ [method]: fake.rejects(new Error('Schedule not found: x')) });
        const routes = ThermostatController(handler);
        const res = buildRes();

        await callRoute(routes, route, req, res);

        expect(res.statusCode, route).to.equal(404);
        expect(res.body.error, route).to.equal('SCHEDULE_NOT_FOUND');
      }),
    );
  });

  it('should let an unexpected error through on every schedule route', async () => {
    const routesUnderTest = [
      ['get /api/v1/service/thermostat/schedule/:selector', 'getScheduleBySelector', { params: { selector: 'x' } }],
      ['post /api/v1/service/thermostat/schedule', 'createSchedule', { body: {} }],
      [
        'patch /api/v1/service/thermostat/schedule/:selector',
        'updateSchedule',
        { params: { selector: 'x' }, body: {} },
      ],
      [
        'put /api/v1/service/thermostat/schedule/:selector/device/:device_selector',
        'attachScheduleToDevice',
        { params: { selector: 'x', device_selector: 'y' } },
      ],
      [
        'delete /api/v1/service/thermostat/schedule/:selector/device/:device_selector',
        'detachScheduleFromDevice',
        { params: { selector: 'x', device_selector: 'y' } },
      ],
    ];

    await Promise.all(
      routesUnderTest.map(async ([route, method, req]) => {
        const handler = buildHandler({ [method]: fake.rejects(new Error('database is on fire')) });
        const routes = ThermostatController(handler);
        const res = buildRes();

        let thrown = null;
        try {
          await callRoute(routes, route, req, res);
        } catch (e) {
          thrown = e;
        }

        expect(thrown, route).to.not.equal(null);
        expect(res.statusCode, route).to.equal(null);
      }),
    );
  });

  it('should let an unexpected error through, rather than dressing it as a 4xx', async () => {
    const handler = buildHandler({ deleteSchedule: fake.rejects(new Error('database is on fire')) });
    const routes = ThermostatController(handler);
    const res = buildRes();

    let thrown = null;
    try {
      await callRoute(
        routes,
        'delete /api/v1/service/thermostat/schedule/:selector',
        { params: { selector: 'my-schedule' } },
        res,
      );
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.not.equal(null);
    expect(res.statusCode).to.equal(null);
  });

  it('should update a schedule', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(
      routes,
      'patch /api/v1/service/thermostat/schedule/:selector',
      { params: { selector: 'my-schedule' }, body: { name: 'New' } },
      res,
    );

    assert.calledWith(handler.updateSchedule, 'my-schedule', { name: 'New' });
    expect(res.body).to.deep.equal({ selector: 'my-schedule' });
  });

  it('should delete a schedule', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(
      routes,
      'delete /api/v1/service/thermostat/schedule/:selector',
      { params: { selector: 'my-schedule' } },
      res,
    );

    assert.calledWith(handler.deleteSchedule, 'my-schedule');
    expect(res.body).to.deep.equal({ success: true });
  });
});
