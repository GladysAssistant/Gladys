const { fake, assert, stub } = require('sinon');
const { expect } = require('chai');
const Enedis = require('../../../services/enedis/lib');

const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const getConsumptionLoadCurveArray = (size) => {
  const date = new Date('2022-08-01');
  const arr = [];
  for (let i = 0; i < size; i += 1) {
    date.setDate(date.getDate() + 1);
    arr.push({
      usage_point_id: '16401220101758',
      value: i,
      created_at: date.toISOString().substring(0, 10),
    });
  }
  return arr;
};

describe('enedis.sync.loadConsumptionCurve', () => {
  it('should sync with only 1 page', async () => {
    const gladys = {
      device: {
        get: fake.resolves([
          {
            id: '865f0fd8-970c-4670-9e1d-f6926a0abed6',
            external_id: 'enedis:16401220101758',
            features: [
              {
                external_id: 'enedis:16401220101758',
                category: 'energy-sensor',
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
        saveHistoricalState: fake.resolves(null),
      },
      gateway: {
        enedisGetConsumptionLoadCurve: fake.resolves(getConsumptionLoadCurveArray(4)),
      },
      job: {
        wrapper: (type, func) => func,
        updateProgress: fake.resolves(null),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    enedisService.enedisSyncBatchSize = 100;
    await enedisService.sync();
    assert.callCount(gladys.device.saveHistoricalState, 4);
    assert.calledOnce(gladys.device.setParam);
  });
  it('should sync with 2 pages', async () => {
    const consumptionLoadCurveStub = stub();
    consumptionLoadCurveStub.onCall(0).resolves(getConsumptionLoadCurveArray(100));
    consumptionLoadCurveStub.onCall(1).resolves(getConsumptionLoadCurveArray(10));
    const gladys = {
      device: {
        get: fake.resolves([
          {
            id: '865f0fd8-970c-4670-9e1d-f6926a0abed6',
            external_id: 'enedis:16401220101758',
            features: [
              {
                external_id: 'enedis:16401220101758',
                category: 'energy-sensor',
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
        saveHistoricalState: fake.resolves(null),
      },
      gateway: {
        enedisGetConsumptionLoadCurve: consumptionLoadCurveStub,
      },
      job: {
        wrapper: (type, func) => func,
        updateProgress: fake.resolves(null),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    enedisService.enedisSyncBatchSize = 100;
    await enedisService.sync();
    assert.callCount(gladys.device.saveHistoricalState, 110);
    assert.calledOnce(gladys.device.setParam);
  });
  it('should not do anything, feature not found', async () => {
    const consumptionLoadCurveStub = stub();
    consumptionLoadCurveStub.onCall(0).resolves(getConsumptionLoadCurveArray(100));
    consumptionLoadCurveStub.onCall(1).resolves(getConsumptionLoadCurveArray(10));
    const gladys = {
      device: {
        get: fake.resolves([
          {
            id: '865f0fd8-970c-4670-9e1d-f6926a0abed6',
            external_id: 'enedis:16401220101758',
            features: [],
            params: [],
          },
        ]),
        setParam: fake.resolves(null),
        saveHistoricalState: fake.resolves(null),
      },
      gateway: {
        enedisGetConsumptionLoadCurve: consumptionLoadCurveStub,
      },
      job: {
        wrapper: (type, func) => func,
        updateProgress: fake.resolves(null),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    enedisService.enedisSyncBatchSize = 100;
    const syncResult = await enedisService.sync(false);
    expect(syncResult).to.deep.equal([
      {
        dailyConsumptionSync: null,
        consumptionLoadCurveSync: null,
      },
    ]);
  });
  it('should sync from one week ago', async () => {
    const consumptionLoadCurveStub = stub();
    consumptionLoadCurveStub.onCall(0).resolves(getConsumptionLoadCurveArray(100));
    consumptionLoadCurveStub.onCall(1).resolves(getConsumptionLoadCurveArray(10));
    const gladys = {
      device: {
        get: fake.resolves([
          {
            id: '865f0fd8-970c-4670-9e1d-f6926a0abed6',
            external_id: 'enedis:16401220101758',
            features: [
              {
                external_id: 'enedis:16401220101758',
                category: 'energy-sensor',
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
              },
            ],
            params: [
              {
                name: 'LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE',
                value: '2022-05-20',
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
        saveHistoricalState: fake.resolves(null),
      },
      gateway: {
        enedisGetConsumptionLoadCurve: consumptionLoadCurveStub,
      },
      job: {
        wrapper: (type, func) => func,
        updateProgress: fake.resolves(null),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    enedisService.enedisSyncBatchSize = 100;
    const syncResult = await enedisService.sync(false);
    expect(syncResult).to.deep.equal([
      {
        consumptionLoadCurveSync: {
          syncFromDate: '2022-05-13',
          lastDateSynced: '2022-05-20',
          firstDateSync: '2022-08-02',
          lastDateSync: '2022-08-11',
          usagePointExternalId: 'enedis:16401220101758',
        },
        dailyConsumptionSync: null,
      },
    ]);
  });
  it('should sync from start', async () => {
    const consumptionLoadCurveStub = stub();
    consumptionLoadCurveStub.onCall(0).resolves(getConsumptionLoadCurveArray(100));
    consumptionLoadCurveStub.onCall(1).resolves(getConsumptionLoadCurveArray(10));
    const gladys = {
      device: {
        get: fake.resolves([
          {
            id: '865f0fd8-970c-4670-9e1d-f6926a0abed6',
            external_id: 'enedis:16401220101758',
            features: [
              {
                external_id: 'enedis:16401220101758',
                category: 'energy-sensor',
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
              },
            ],
            params: [
              {
                name: 'LAST_DATE_SYNCED_CONSUMPTION_LOAD_CURVE',
                value: '2022-05-20',
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
        saveHistoricalState: fake.resolves(null),
      },
      gateway: {
        enedisGetConsumptionLoadCurve: consumptionLoadCurveStub,
      },
      job: {
        wrapper: (type, func) => func,
        updateProgress: fake.resolves(null),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    enedisService.enedisSyncBatchSize = 100;
    const syncResult = await enedisService.sync(true);
    expect(syncResult).to.deep.equal([
      {
        dailyConsumptionSync: null,
        consumptionLoadCurveSync: {
          syncFromDate: undefined,
          lastDateSynced: '2022-05-20',
          firstDateSync: '2022-08-02',
          lastDateSync: '2022-08-11',
          usagePointExternalId: 'enedis:16401220101758',
        },
      },
    ]);
  });
  it('should recalculate cost once from the earliest date across all usage points', async () => {
    const calculateCostFromDate = fake.resolves(null);
    const gladys = {
      device: {
        get: fake.resolves([
          {
            id: '865f0fd8-970c-4670-9e1d-f6926a0abed6',
            external_id: 'enedis:16401220101758',
            features: [
              {
                external_id: 'enedis:16401220101758',
                category: 'energy-sensor',
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
              },
            ],
          },
          {
            id: '15cabd5e-4c2f-4b55-80af-228c74b11ec5',
            external_id: 'enedis:26401220101758',
            features: [
              {
                external_id: 'enedis:26401220101758',
                category: 'energy-sensor',
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
        saveHistoricalState: fake.resolves(null),
      },
      gateway: {
        enedisGetDailyConsumption: fake.resolves([
          {
            value: 12,
            created_at: '2022-08-03',
          },
        ]),
        enedisGetConsumptionLoadCurve: fake.resolves([
          {
            value: 500,
            created_at: '2022-08-01T00:30:00.000Z',
          },
        ]),
      },
      service: {
        getService: fake.returns({
          device: {
            calculateCostFromDate,
          },
        }),
      },
      job: {
        wrapper: (type, func) => func,
        updateProgress: fake.resolves(null),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    enedisService.enedisSyncBatchSize = 100;

    await enedisService.sync();

    assert.calledOnce(calculateCostFromDate);
    assert.calledWithExactly(calculateCostFromDate, '2022-08-01T00:30:00.000Z');
    assert.callCount(gladys.device.saveHistoricalState, 2);
  });
  it('should sync with 1 page = 100', async () => {
    const consumptionLoadCurveStub = stub();
    consumptionLoadCurveStub.onCall(0).resolves(getConsumptionLoadCurveArray(100));
    consumptionLoadCurveStub.onCall(1).resolves(getConsumptionLoadCurveArray(0));
    const gladys = {
      device: {
        get: fake.resolves([
          {
            id: '865f0fd8-970c-4670-9e1d-f6926a0abed6',
            external_id: 'enedis:16401220101758',
            features: [
              {
                external_id: 'enedis:16401220101758',
                category: 'energy-sensor',
                type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
        saveHistoricalState: fake.resolves(null),
      },
      gateway: {
        enedisGetConsumptionLoadCurve: consumptionLoadCurveStub,
      },
      job: {
        wrapper: (type, func) => func,
        updateProgress: fake.resolves(null),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    enedisService.enedisSyncBatchSize = 100;
    await enedisService.sync();
    assert.callCount(gladys.device.saveHistoricalState, 100);
    assert.calledOnce(gladys.device.setParam);
  });
});
