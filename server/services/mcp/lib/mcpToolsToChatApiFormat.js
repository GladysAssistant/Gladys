const z = require('zod/v4');

/**
 * @description Convert MCP intent name to OpenAI/Mistral function name.
 * @param {string} intent
 * @returns {string}
 */
function toolNameFromIntent(intent) {
  return intent.replace(/[.\-]/g, '_');
}

/**
 * @description Build OpenAI-compatible tool definitions from MCP tool schemas.
 * Uses the same Zod inputSchema as the MCP server (rooms, devices, intervals, etc.)
 * so the model receives the actual enum values from the home.
 * @param {Array<{ intent: string, config: { title?: string, description?: string, inputSchema: object } }>} mcpTools
 * @returns {Array<{ type: string, function: object }>}
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
