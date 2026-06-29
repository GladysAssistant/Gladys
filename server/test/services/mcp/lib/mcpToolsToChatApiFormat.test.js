const { expect } = require('chai');
const {
  applyDeviceTargetingSchema,
  toolNameFromIntent,
} = require('../../../../services/mcp/lib/mcpToolsToChatApiFormat');

describe('mcpToolsToChatApiFormat', () => {
  it('should convert intent names to chat API function names', () => {
    expect(toolNameFromIntent('device.turn-on-off')).to.equal('device_turn_on_off');
  });
});

describe('applyDeviceTargetingSchema', () => {
  it('should keep action in required and add anyOf branches', () => {
    const parameters = applyDeviceTargetingSchema({
      type: 'object',
      properties: {
        action: { type: 'string' },
        device: { type: 'string' },
        room: { type: 'string' },
        device_category: { type: 'string' },
      },
      required: ['action'],
    });

    expect(parameters.required).to.deep.equal(['action']);
    expect(parameters.anyOf).to.deep.equal([
      { required: ['action', 'device'] },
      { required: ['action', 'room', 'device_category'] },
    ]);
  });
});
