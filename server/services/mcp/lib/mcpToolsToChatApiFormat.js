const z = require('zod/v4');

/**
 * @description Convert MCP intent name to OpenAI/Mistral function name.
 * @param {string} intent - MCP intent name.
 * @returns {string} Chat API compatible function name.
 * @example
 * toolNameFromIntent('device.get-state');
 */
function toolNameFromIntent(intent) {
  return intent.replace(/[.-]/g, '_');
}

/**
 * @description Require either a device name or both room and device_category in tool parameters.
 * @param {object} parameters - JSON Schema parameters object.
 * @returns {object} Parameters with anyOf targeting constraints.
 * @example
 * applyDeviceTargetingSchema({ type: 'object', properties: { action: {} }, required: ['action'] });
 */
function applyDeviceTargetingSchema(parameters) {
  const baseRequired = parameters.required ?? [];
  const requiredWithAction = baseRequired.includes('action') ? baseRequired : ['action', ...baseRequired];

  return {
    ...parameters,
    required: requiredWithAction,
    anyOf: [
      { required: [...requiredWithAction, 'device'] },
      { required: [...requiredWithAction, 'room', 'device_category'] },
    ],
  };
}

/**
 * @description Build OpenAI-compatible tool definitions from MCP tool schemas.
 * Uses the same Zod inputSchema as the MCP server (rooms, devices, intervals, etc.)
 * so the model receives the actual enum values from the home.
 * @param {Array<object>} mcpTools - MCP tools with intent/config/inputSchema.
 * @returns {Array<object>} Tools formatted for chat API.
 * @example
 * mcpToolsToChatApiFormat([{ intent: 'device.get-state', config: { inputSchema: {} } }]);
 */
function mcpToolsToChatApiFormat(mcpTools) {
  return mcpTools.map(({ intent, config }) => {
    let parameters = z.object(config.inputSchema).toJSONSchema();
    delete parameters.$schema;

    if (config.requireDeviceTargeting) {
      parameters = applyDeviceTargetingSchema(parameters);
    }

    return {
      type: 'function',
      function: {
        name: toolNameFromIntent(intent),
        description: config.description || config.title || intent,
        parameters,
      },
    };
  });
}

module.exports = {
  mcpToolsToChatApiFormat,
  toolNameFromIntent,
  applyDeviceTargetingSchema,
};
