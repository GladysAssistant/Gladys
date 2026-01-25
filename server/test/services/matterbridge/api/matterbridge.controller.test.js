const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const MatterbridgeController = require('../../../../services/matterbridge/api/matterbridge.controller');

describe('Matterbridge controller', () => {
  let matterbridgeManager;
  let controller;
  let res;

  beforeEach(() => {
    matterbridgeManager = {
      status: fake.resolves({
        matterbridgeExist: true,
        matterbridgeRunning: true,
        matterbridgeEnabled: true,
        dockerBased: true,
        networkModeValid: true,
      }),
      init: fake.resolves(null),
      installContainer: fake.resolves(null),
      disconnect: fake.resolves(null),
    };

    controller = MatterbridgeController({}, matterbridgeManager);

    res = {
      json: fake.returns(null),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get status', async () => {
    await controller['get /api/v1/service/matterbridge/status'].controller({}, res);

    assert.calledOnce(matterbridgeManager.status);
    assert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({
      matterbridgeExist: true,
      matterbridgeRunning: true,
      matterbridgeEnabled: true,
      dockerBased: true,
      networkModeValid: true,
    });
  });

  it('should connect', async () => {
    await controller['post /api/v1/service/matterbridge/connect'].controller({}, res);

    assert.calledOnce(matterbridgeManager.init);
    assert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true });
  });

  it('should start container', async () => {
    await controller['post /api/v1/service/matterbridge/start'].controller({}, res);

    assert.calledOnce(matterbridgeManager.installContainer);
    assert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true });
  });

  it('should disconnect', async () => {
    await controller['post /api/v1/service/matterbridge/disconnect'].controller({}, res);

    assert.calledOnce(matterbridgeManager.disconnect);
    assert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true });
  });
});
