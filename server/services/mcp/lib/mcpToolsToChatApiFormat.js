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
    const parameters = z.object(config.inputSchema).toJSONSchema();
    delete parameters.$schema;

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
};
