const { expect } = require('chai');

const MCPService = require('../../../services/mcp/index');

describe('MCPService', () => {
  let gladys;
  let mcpService;

  before(() => {
    gladys = {
      room: {
        getAll: async () => [],
      },
      scene: {
        get: async () => [],
      },
      device: {
        get: async () => [],
      },
      event: {
        on: () => {},
      },
    };
    mcpService = MCPService(gladys);
  });

  it('should start service', async () => {
    await mcpService.start();
    expect(mcpService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });

  it('should stop service', async () => {
    await mcpService.stop();
    expect(mcpService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
});
