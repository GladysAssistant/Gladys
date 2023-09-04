const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { PROPERTY } = require('../../../../../services/sunspec/lib/sunspec.constants');

const { fake, assert } = sinon;

describe('SunSpec BDPV', () => {
  let gladys;
  let sunspecManager;
  let MockedClient;
  let MockedCron;
  let BdpvInit;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
      stateManager: {
        get: fake.returns({
          property: PROPERTY.DCWH,
          last_value: 1234,
        }),
      },
      variable: {
        getValue: sinon
          .stub()
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
            features: [
              {
                property: PROPERTY.DCWH,
                last_Value: 1234,
              },
            ],
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

    BdpvInit = proxyquire('../../../../../services/sunspec/lib/bdpv/sunspec.bdpv', {
      axios: MockedClient,
      'node-cron': MockedCron,
    }).bdpvInit;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should bdpvInit active', async () => {
    await BdpvInit.call(sunspecManager, true);
    sunspecManager.bdpvTask.run.call(sunspecManager);
    assert.calledTwice(gladys.variable.getValue);
    assert.calledOnce(MockedClient.create);
    // eslint-disable-next-line no-unused-expressions
    expect(sunspecManager.bdpvTask).to.be.not.null;
    assert.calledOnce(sunspecManager.bdpvTask.start);
    assert.notCalled(sunspecManager.bdpvTask.stop);
  });

  it('should bdpvInit not active', async () => {
    await BdpvInit.call(sunspecManager, false);
    assert.calledTwice(gladys.variable.getValue);
    assert.calledOnce(MockedClient.create);
    // eslint-disable-next-line no-unused-expressions
    expect(sunspecManager.bdpvTask).to.be.not.null;
    assert.notCalled(sunspecManager.bdpvTask.start);
    assert.calledOnce(sunspecManager.bdpvTask.stop);
  });
});
