const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub, fake } = sinon;
const { stopServer } = require('../../../../services/mcp/lib/stopServer');

describe('Stop server', () => {
  it('should stop a server and remove event listeners', async () => {
    const reloadCb = fake();

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      stopServer,
      reloadCb,
      schemas: { resources: [], tools: [] },
      listening: true,
      gladys: {
        event: {
          removeListener: stub(),
        },
      },
    };

    await mcpHandler.stopServer();

    expect(mcpHandler.gladys.event.removeListener.callCount).to.eq(2);
    expect(mcpHandler.gladys.event.removeListener.firstCall.args[0]).to.eq('device.create');
    expect(mcpHandler.gladys.event.removeListener.firstCall.args[1]).to.eq(reloadCb);
    expect(mcpHandler.gladys.event.removeListener.secondCall.args[0]).to.eq('device.update');
    expect(mcpHandler.gladys.event.removeListener.secondCall.args[1]).to.eq(reloadCb);

    expect(mcpHandler.listening).to.eq(false);
    expect(mcpHandler.schemas).to.eq(null);
  });
});
