const { expect } = require('chai');
const { stub, fake } = require('sinon');
const { stopServer } = require('../../../../services/mcp/lib/stopServer');

describe('Stop server', () => {
  it('should stop a server and remove event listeners', async () => {
    const reloadCb = fake();
    const serverInstance = {
      close: fake(),
    };

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      stopServer,
      reloadCb,
      server: serverInstance,
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

    expect(serverInstance.close.callCount).to.eq(1);
    expect(mcpHandler.server).to.eq(null);
  });
});
