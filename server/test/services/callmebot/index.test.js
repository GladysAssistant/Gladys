const { expect } = require('chai');
const { fake } = require('sinon');
const CallMeBotService = require('../../../services/callmebot');

describe('callmebot', () => {
  it('should start service', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('test-value'),
      },
    };
    const callmebotService = CallMeBotService(gladys, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
    await callmebotService.start();
  });

  it('should stop service', async () => {
    const gladys = {};
    const callmebotService = CallMeBotService(gladys, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
    await callmebotService.stop();
  });

  it('should return if service is used', async () => {
    const gladys = {
      variable: {
        getVariables: fake.resolves(['test-api-key']),
      },
    };
    const callmebotService = CallMeBotService(gladys, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
    const used = await callmebotService.isUsed();
    expect(used).to.equal(true);
  });
});
