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
  createSchedule: fake.resolves({ selector: 'new-schedule' }),
  updateSchedule: fake.resolves({ selector: 'my-schedule' }),
  deleteSchedule: fake.resolves(null),
  setValue: fake.resolves(null),
  setVariable: fake.resolves({ value: 'comfort' }),
  getVariable: fake.resolves('comfort'),
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

    expect(Object.keys(routes)).to.have.lengthOf(10);
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

    await callRoute(routes, 'get /api/v1/service/thermostat/schedule', {}, res);

    expect(res.body).to.deep.equal([{ selector: 'my-schedule' }]);
  });

  it('should create a schedule', async () => {
    const handler = buildHandler();
    const routes = ThermostatController(handler);
    const res = buildRes();

    await callRoute(routes, 'post /api/v1/service/thermostat/schedule', { body: { name: 'Semaine' } }, res);

    assert.calledWith(handler.createSchedule, { name: 'Semaine' });
    expect(res.body).to.deep.equal({ selector: 'new-schedule' });
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

  describe('setSetpoint', () => {
    const route = 'post /api/v1/service/thermostat/setpoint/:feature_selector';

    it('should set the setpoint through setValue', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(
        routes,
        route,
        { params: { feature_selector: 'thermostat-living-room' }, body: { value: '21.5' } },
        res,
      );

      assert.calledWith(handler.setValue, thermostatDevice, setpointFeature, 21.5);
      expect(res.body).to.deep.equal({ success: true, value: 21.5 });
    });

    it('should reject a non-numeric value', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(
        routes,
        route,
        { params: { feature_selector: 'thermostat-living-room' }, body: { value: 'hot' } },
        res,
      );

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'INVALID_VALUE' });
      assert.notCalled(handler.setValue);
    });

    it('should reject an empty value, which Number() would turn into 0', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(
        routes,
        route,
        { params: { feature_selector: 'thermostat-living-room' }, body: { value: '' } },
        res,
      );

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'INVALID_VALUE' });
      assert.notCalled(handler.setValue);
    });

    it('should reject a null value, which Number() would turn into 0', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(
        routes,
        route,
        { params: { feature_selector: 'thermostat-living-room' }, body: { value: null } },
        res,
      );

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'INVALID_VALUE' });
      assert.notCalled(handler.setValue);
    });

    it('should reject a body with no value at all', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: { feature_selector: 'thermostat-living-room' }, body: {} }, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'INVALID_VALUE' });
      assert.notCalled(handler.setValue);
    });

    it('should refuse to write a feature that does not belong to this service', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: { feature_selector: 'front-door-lock' }, body: { value: 1 } }, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'FEATURE_NOT_FOUND' });
      assert.notCalled(handler.setValue);
    });

    it('should refuse a thermostat feature that is not a setpoint', async () => {
      const handler = buildHandler({
        getDevices: fake.resolves([
          {
            selector: 'my-thermostat',
            features: [
              {
                selector: 'thermostat-mode',
                category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
                type: 'mode',
              },
            ],
          },
        ]),
      });
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: { feature_selector: 'thermostat-mode' }, body: { value: 1 } }, res);

      expect(res.statusCode).to.equal(404);
      assert.notCalled(handler.setValue);
    });

    it('should tolerate a device without features', async () => {
      const handler = buildHandler({ getDevices: fake.resolves([{ selector: 'empty' }]) });
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(
        routes,
        route,
        { params: { feature_selector: 'thermostat-living-room' }, body: { value: 20 } },
        res,
      );

      expect(res.statusCode).to.equal(404);
    });
  });

  describe('setVariable', () => {
    const route = 'post /api/v1/service/thermostat/state/:variable_key';

    it('should set a THERMOSTAT_ variable', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(
        routes,
        route,
        { params: { variable_key: 'THERMOSTAT_X_PRESET' }, body: { value: 'comfort' } },
        res,
      );

      assert.calledWith(handler.setVariable, 'THERMOSTAT_X_PRESET', 'comfort');
      expect(res.body).to.deep.equal({ value: 'comfort' });
    });

    it('should reject a configuration key: the config lives on the device', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(
        routes,
        route,
        { params: { variable_key: 'THERMOSTAT_CONFIG_LIVING_ROOM' }, body: { value: '{}' } },
        res,
      );

      expect(res.statusCode).to.equal(400);
      assert.notCalled(handler.setVariable);
    });

    it('should reject a key outside the THERMOSTAT_ namespace', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: { variable_key: 'SOME_OTHER_KEY' }, body: { value: 'x' } }, res);

      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'INVALID_VARIABLE_KEY' });
      assert.notCalled(handler.setVariable);
    });

    it('should reject a missing key', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: {}, body: { value: 'x' } }, res);

      expect(res.statusCode).to.equal(400);
      assert.notCalled(handler.setVariable);
    });
  });

  describe('getVariable', () => {
    const route = 'get /api/v1/service/thermostat/state/:variable_key';

    it('should return a runtime variable', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: { variable_key: 'THERMOSTAT_X_PRESET' } }, res);

      assert.calledWith(handler.getVariable, 'THERMOSTAT_X_PRESET');
      expect(res.body).to.deep.equal({ value: 'comfort' });
    });

    it('should return 404 when the variable is not set', async () => {
      const handler = buildHandler({ getVariable: fake.resolves(null) });
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: { variable_key: 'THERMOSTAT_X_PRESET' } }, res);

      expect(res.statusCode).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'VARIABLE_NOT_FOUND' });
    });

    it('should reject a key outside the runtime namespace', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: { variable_key: 'THERMOSTAT_CONFIG_X' } }, res);

      expect(res.statusCode).to.equal(400);
      assert.notCalled(handler.getVariable);
    });
  });

  describe('applySchedules', () => {
    const route = 'post /api/v1/service/thermostat/apply-schedules';

    it('should trigger a regulation pass', async () => {
      const handler = buildHandler();
      const routes = ThermostatController(handler);
      const res = buildRes();

      await callRoute(routes, route, { params: {}, body: {} }, res);

      assert.calledOnce(handler.triggerApplySchedules);
      // The widgets must reload the config too, not just the heater re-regulate.
      assert.calledOnce(handler.broadcastConfigUpdated);
      expect(res.body).to.deep.equal({ success: true });
    });
  });
});
