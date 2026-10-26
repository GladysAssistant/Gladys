const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub, fake } = sinon;
const { loadSchemas } = require('../../../../services/mcp/lib/loadSchemas');

describe('Load schemas', () => {
  let mcpHandler;
  let resources;
  let tools;

  beforeEach(() => {
    resources = [
      {
        name: 'resource1',
        uri: 'uri://resource1',
        config: { description: 'Resource 1' },
        cb: fake(),
      },
    ];

    tools = [
      {
        intent: 'device.turn-on-off',
        config: { description: 'Turn on/off device' },
        cb: fake(),
      },
    ];

    mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      loadSchemas,
      reloadCb: fake(),
      getAllResources: stub().resolves(resources),
      getAllTools: stub().resolves(tools),
      schemas: null,
      listening: false,
      gladys: { event: { on: stub() } },
    };
  });

  it('should load resources and tools and listen to device changes', async () => {
    await mcpHandler.loadSchemas();

    expect(mcpHandler.gladys.event.on.callCount).to.eq(2);
    expect(mcpHandler.gladys.event.on.firstCall.args).to.deep.equal(['device.create', mcpHandler.reloadCb]);
    expect(mcpHandler.gladys.event.on.secondCall.args).to.deep.equal(['device.update', mcpHandler.reloadCb]);

    expect(mcpHandler.listening).to.eq(true);

    expect(mcpHandler.getAllResources.callCount).to.eq(1);
    expect(mcpHandler.getAllTools.callCount).to.eq(1);
    expect(mcpHandler.schemas).to.deep.equal({ resources, tools });
  });

  it('should not listen twice to device changes when a failed load is retried', async () => {
    mcpHandler.getAllResources.onFirstCall().rejects(new Error('Database error'));

    let error;
    try {
      await mcpHandler.loadSchemas();
    } catch (e) {
      error = e;
    }

    expect(error.message).to.eq('Database error');
    expect(mcpHandler.schemas).to.eq(null);

    await mcpHandler.loadSchemas();

    expect(mcpHandler.gladys.event.on.callCount).to.eq(2);
    expect(mcpHandler.schemas).to.deep.equal({ resources, tools });
  });

  it('should reload resources and tools without listening twice to device changes', async () => {
    await mcpHandler.loadSchemas();

    const newTools = [];
    mcpHandler.getAllTools = stub().resolves(newTools);

    await mcpHandler.loadSchemas();

    expect(mcpHandler.gladys.event.on.callCount).to.eq(2);
    expect(mcpHandler.getAllResources.callCount).to.eq(2);
    expect(mcpHandler.getAllTools.callCount).to.eq(1);
    expect(mcpHandler.schemas).to.deep.equal({ resources, tools: newTools });
  });
});
