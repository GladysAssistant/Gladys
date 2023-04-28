const { fake, assert, stub } = require('sinon');
const { expect } = require('chai');
const Enedis = require('../../../services/enedis/lib');

const getDailyConsumptionArray = (size) => {
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

describe('enedis.sync', () => {
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
                type: 'daily-consumption',
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
      },
      event: {
        emit: fake.returns(null),
      },
      gateway: {
        enedisGetDailyConsumption: fake.resolves(getDailyConsumptionArray(4)),
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    await enedisService.sync();
    assert.callCount(gladys.event.emit, 4);
    assert.calledOnce(gladys.device.setParam);
  });
  it('should sync with 2 pages', async () => {
    const dailyConsumptionStub = stub();
    dailyConsumptionStub.onCall(0).resolves(getDailyConsumptionArray(100));
    dailyConsumptionStub.onCall(1).resolves(getDailyConsumptionArray(10));
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
                type: 'daily-consumption',
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
      },
      event: {
        emit: fake.returns(null),
      },
      gateway: {
        enedisGetDailyConsumption: dailyConsumptionStub,
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    await enedisService.sync();
    assert.callCount(gladys.event.emit, 110);
    assert.calledOnce(gladys.device.setParam);
  });
  it('should not do anything, feature not found', async () => {
    const dailyConsumptionStub = stub();
    dailyConsumptionStub.onCall(0).resolves(getDailyConsumptionArray(100));
    dailyConsumptionStub.onCall(1).resolves(getDailyConsumptionArray(10));
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
      },
      event: {
        emit: fake.returns(null),
      },
      gateway: {
        enedisGetDailyConsumption: dailyConsumptionStub,
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    const syncResult = await enedisService.sync(false);
    expect(syncResult).to.deep.equal([null]);
  });
  it('should sync from one week ago', async () => {
    const dailyConsumptionStub = stub();
    dailyConsumptionStub.onCall(0).resolves(getDailyConsumptionArray(100));
    dailyConsumptionStub.onCall(1).resolves(getDailyConsumptionArray(10));
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
                type: 'daily-consumption',
              },
            ],
            params: [
              {
                name: 'LAST_DATE_SYNCED',
                value: '2022-05-20',
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
      },
      event: {
        emit: fake.returns(null),
      },
      gateway: {
        enedisGetDailyConsumption: dailyConsumptionStub,
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    const syncResult = await enedisService.sync(false);
    expect(syncResult).to.deep.equal([
      {
        syncFromDate: '2022-05-13',
        lastDateSynced: '2022-05-20',
        lastDateSync: '2022-08-11',
        usagePointExternalId: 'enedis:16401220101758',
      },
    ]);
  });
  it('should sync from start', async () => {
    const dailyConsumptionStub = stub();
    dailyConsumptionStub.onCall(0).resolves(getDailyConsumptionArray(100));
    dailyConsumptionStub.onCall(1).resolves(getDailyConsumptionArray(10));
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
                type: 'daily-consumption',
              },
            ],
            params: [
              {
                name: 'LAST_DATE_SYNCED',
                value: '2022-05-20',
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
      },
      event: {
        emit: fake.returns(null),
      },
      gateway: {
        enedisGetDailyConsumption: dailyConsumptionStub,
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    const syncResult = await enedisService.sync(true);
    expect(syncResult).to.deep.equal([
      {
        syncFromDate: undefined,
        lastDateSynced: '2022-05-20',
        lastDateSync: '2022-08-11',
        usagePointExternalId: 'enedis:16401220101758',
      },
    ]);
  });
  it('should sync with 1 page = 100', async () => {
    const dailyConsumptionStub = stub();
    dailyConsumptionStub.onCall(0).resolves(getDailyConsumptionArray(100));
    dailyConsumptionStub.onCall(1).resolves(getDailyConsumptionArray(0));
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
                type: 'daily-consumption',
              },
            ],
          },
        ]),
        setParam: fake.resolves(null),
      },
      event: {
        emit: fake.returns(null),
      },
      gateway: {
        enedisGetDailyConsumption: dailyConsumptionStub,
      },
    };
    const enedisService = new Enedis(gladys);
    enedisService.syncDelayBetweenCallsInMs = 0;
    await enedisService.sync();
    assert.callCount(gladys.event.emit, 100);
    assert.calledOnce(gladys.device.setParam);
  });
});
