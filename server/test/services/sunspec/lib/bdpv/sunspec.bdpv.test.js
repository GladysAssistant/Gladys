const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { PROPERTY } = require('../../../../../services/sunspec/lib/sunspec.constants');

const { fake, assert, stub } = sinon;

describe('SunSpec BDPV', () => {
  let gladys;
  let sunspecManager;
  let MockedClient;
  let MockedCron;
  let Bdpv;

  beforeEach(() => {
    const feature1 = {
      property: PROPERTY.ACWH,
      last_value: 1234,
    };
    const feature2 = {
      property: PROPERTY.ACWH,
      last_value: 5678,
    };
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
      stateManager: {
        get: stub()
          .onFirstCall()
          .returns(feature1)
          .onSecondCall()
          .returns(feature2),
      },
      variable: {
        getValue: stub()
          .onFirstCall()
          .returns('SUNSPEC_BDPV_USER_NAME')
          .onSecondCall()
          .returns('SUNSPEC_BDPV_API_KEY'),
      },
    };

    sunspecManager = {
      gladys,
      getDevices: () => {
        return [
          {
            features: [feature1],
          },
          {
            features: [feature2],
          },
        ];
      },
    };

    MockedClient = {
      create: fake.returns({
        get: fake.returns({
          status: true,
        }),
      }),
    };
    MockedCron = {
      schedule: (expr, callback) => {
        return {
          start: fake.returns(null),
          stop: fake.returns(null),
          run: callback,
        };
      },
    };

    Bdpv = proxyquire('../../../../../services/sunspec/lib/bdpv/sunspec.bdpv', {
      axios: MockedClient,
      'node-cron': MockedCron,
    });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should bdpvInit active', async () => {
    await Bdpv.bdpvInit.call(sunspecManager, true);
    sunspecManager.bdpvTask.run.call(sunspecManager);
    assert.calledTwice(gladys.variable.getValue);
    assert.calledOnce(MockedClient.create);
    // eslint-disable-next-line no-unused-expressions
    expect(sunspecManager.bdpvTask).to.be.not.null;
    assert.calledOnce(sunspecManager.bdpvTask.start);
    assert.notCalled(sunspecManager.bdpvTask.stop);
  });

  it('should bdpvInit not active', async () => {
    await Bdpv.bdpvInit.call(sunspecManager, false);
  });

  it('should bdpvInit disactivated', async () => {
    sunspecManager.bdpvTask = {
      stop: fake.returns(null),
    };
    await Bdpv.bdpvInit.call(sunspecManager, false);
    assert.calledOnce(sunspecManager.bdpvTask.stop);
  });

  it('should bdpvPush', async () => {
    sunspecManager.bdpvParams = {};
    sunspecManager.bdpvClient = {
      get: fake.returns({
        status: true,
      }),
    };
    await Bdpv.bdpvPush.call(sunspecManager);
    assert.calledOnceWithExactly(sunspecManager.bdpvClient.get, 'expeditionProd_v3.php', {
      params: {
        index: 6912000,
      },
    });
  });

  it('should bdpvPush error', async () => {
    sunspecManager.bdpvParams = {};
    sunspecManager.bdpvClient = {
      get: fake.throws(new Error('error')),
    };
    await Bdpv.bdpvPush.call(sunspecManager);
  });
});
