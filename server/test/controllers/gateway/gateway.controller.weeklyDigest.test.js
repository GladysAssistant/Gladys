const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;

const GatewayController = require('../../../api/controllers/gateway.controller');

describe('gateway.controller weekly digest endpoints', () => {
  let res;
  let gladys;

  beforeEach(() => {
    res = {
      json: fake(),
    };
    gladys = {
      gateway: {
        sendWeeklyDigest: fake.resolves({ sent: 1 }),
        scheduleWeeklyDigest: fake.resolves(null),
      },
    };
  });

  it('should call gateway sendWeeklyDigest with force option', async () => {
    const controller = GatewayController(gladys);

    await controller.sendWeeklyDigest({}, res);

    sinonAssert.calledOnceWithExactly(gladys.gateway.sendWeeklyDigest, { force: true });
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ sent: 1 });
  });

  it('should call gateway scheduleWeeklyDigest', async () => {
    const controller = GatewayController(gladys);

    await controller.rescheduleWeeklyDigest({}, res);

    sinonAssert.calledOnce(gladys.gateway.scheduleWeeklyDigest);
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true });
  });
});
