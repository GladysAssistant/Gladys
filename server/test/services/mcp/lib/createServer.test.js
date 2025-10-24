const { expect } = require('chai');
const { stub, fake } = require('sinon');
const { createServer } = require('../../../../services/mcp/lib/createServer');

describe('Create server', () => {
  it('should create a server', async () => {
    const mcpServerInstance = {
      registerResource: fake(),
      registerTool: fake(),
    };

    const resources = [
      {
        name: 'resource1',
        uri: 'uri://resource1',
        config: { description: 'Resource 1' },
        cb: fake(),
      },
    ];

    const tools = [
      {
        intent: 'device.turn-on-off',
        config: { description: 'Turn on/off device' },
        cb: fake(),
      },
    ];

    const mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      createServer,
      getAllResources: stub().resolves(resources),
      getAllTools: stub().resolves(tools),
      mcp: {
        McpServer: stub().returns(mcpServerInstance),
      },
      server: null,
    };

    await mcpHandler.createServer();

    expect(mcpHandler.mcp.McpServer.callCount).to.eq(1);
    expect(mcpHandler.mcp.McpServer.firstCall.args[0]).to.deep.equal({
      name: 'Gladys',
      title: 'Gladys',
      version: '1.0.O',
    });
    expect(mcpHandler.mcp.McpServer.firstCall.args[1]).to.deep.equal({
      capabilities: {
        resources: {},
        tools: {},
      },
    });

    expect(mcpHandler.getAllResources.callCount).to.eq(1);
    expect(mcpHandler.getAllTools.callCount).to.eq(1);

    expect(mcpServerInstance.registerResource.callCount).to.eq(1);
    expect(mcpServerInstance.registerResource.firstCall.args).to.deep.equal([
      'resource1',
      'uri://resource1',
      { description: 'Resource 1' },
      resources[0].cb,
    ]);

    expect(mcpServerInstance.registerTool.callCount).to.eq(1);
    expect(mcpServerInstance.registerTool.firstCall.args).to.deep.equal([
      'device_turn-on-off',
      { description: 'Turn on/off device' },
      tools[0].cb,
    ]);

    expect(mcpHandler.server).to.eq(mcpServerInstance);
  });
});
