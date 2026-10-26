const z = require('zod/v4');

// JSON Schema keywords the AI provider cannot compile into its tool-call grammar:
// with tool_choice=required, a single one of them makes the provider reject the
// whole request ("Grammar error: Unimplemented keys"). They only narrow what the
// model may produce, and the tool callbacks validate their arguments again.
const UNSUPPORTED_SCHEMA_KEYWORDS = new Set(['propertyNames']);

// Keywords whose value maps names to sub-schemas: the names are not keywords.
const SCHEMA_MAP_KEYWORDS = new Set(['properties', '$defs', 'definitions', 'patternProperties']);

// Keywords whose value is data, not a schema.
const SCHEMA_DATA_KEYWORDS = new Set(['enum', 'const', 'default', 'examples', 'required']);

// Below this size (serialized JSON length), repeating a sub-schema inline costs
// less than the indirection of a $ref.
const REPEATED_SCHEMA_MIN_SIZE = 500;

/**
 * @description Remove the JSON Schema keywords the AI provider does not support.
 * @param {*} schema - JSON Schema (or part of it).
 * @returns {*} Copy of the schema without the unsupported keywords.
 * @example
 * removeUnsupportedSchemaKeywords({ type: 'object', propertyNames: { pattern: '^[a-z]+$' } });
 */
function removeUnsupportedSchemaKeywords(schema) {
  if (Array.isArray(schema)) {
    return schema.map(removeUnsupportedSchemaKeywords);
  }
  if (schema === null || typeof schema !== 'object') {
    return schema;
  }
  const result = {};
  Object.entries(schema).forEach(([key, value]) => {
    if (UNSUPPORTED_SCHEMA_KEYWORDS.has(key)) {
      return;
    }
    if (SCHEMA_DATA_KEYWORDS.has(key)) {
      result[key] = value;
    } else if (SCHEMA_MAP_KEYWORDS.has(key) && value !== null && typeof value === 'object') {
      result[key] = Object.fromEntries(
        Object.entries(value).map(([name, subSchema]) => [name, removeUnsupportedSchemaKeywords(subSchema)]),
      );
    } else {
      result[key] = removeUnsupportedSchemaKeywords(value);
    }
  });
  return result;
}

/**
 * @description Walk the sub-schemas of a JSON Schema, with the name of the property
 * they describe. The definitions themselves ($defs) are not visited, only their content.
 * @param {*} schema - JSON Schema (or part of it).
 * @param {Function} visit - Called with (subSchema, propertyName, parent, key) for each object sub-schema.
 * @param {string} [propertyName] - Name of the property described by the schema.
 * @example
 * walkSubSchemas({ properties: { room: { type: 'string' } } }, (subSchema, name) => console.log(name));
 */
function walkSubSchemas(schema, visit, propertyName) {
  if (schema === null || typeof schema !== 'object') {
    return;
  }
  Object.entries(schema).forEach(([key, value]) => {
    if (value === null || typeof value !== 'object' || SCHEMA_DATA_KEYWORDS.has(key)) {
      return;
    }
    if (SCHEMA_MAP_KEYWORDS.has(key)) {
      Object.entries(value).forEach(([name, subSchema]) => {
        const subSchemaPropertyName = key === 'properties' ? name : propertyName;
        if (key !== '$defs' && key !== 'definitions' && subSchema !== null && typeof subSchema === 'object') {
          visit(subSchema, subSchemaPropertyName, value, name);
        }
        walkSubSchemas(subSchema, visit, subSchemaPropertyName);
      });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((subSchema, index) => {
        if (subSchema !== null && typeof subSchema === 'object') {
          visit(subSchema, propertyName, value, index);
          walkSubSchemas(subSchema, visit, propertyName);
        }
      });
      return;
    }
    visit(value, propertyName, schema, key);
    walkSubSchemas(value, visit, propertyName);
  });
}

/**
 * @description Find the largest sub-schema repeated in a JSON Schema.
 * @param {object} parameters - JSON Schema of the tool parameters.
 * @param {number} minSize - Minimum size (serialized JSON length) of the sub-schema.
 * @returns {Array|undefined} [serialized sub-schema, its locations], undefined when nothing is repeated.
 * @example
 * findLargestRepeatedSchema({ type: 'object', properties: { a: bigEnum, b: bigEnum } }, 500);
 */
function findLargestRepeatedSchema(parameters, minSize) {
  const occurrences = new Map();
  walkSubSchemas(parameters, (subSchema, propertyName, parent, key) => {
    const serialized = JSON.stringify(subSchema);
    if (serialized.length < minSize) {
      return;
    }
    if (!occurrences.has(serialized)) {
      occurrences.set(serialized, []);
    }
    occurrences.get(serialized).push({ propertyName, parent, key });
  });
  const [largest] = [...occurrences.entries()]
    .filter(([, locations]) => locations.length > 1)
    .sort(([a], [b]) => b.length - a.length);
  return largest;
}

/**
 * @description Write once in $defs the large sub-schemas repeated in a tool schema, and
 * reference them with $ref. For example scene.create repeats the enum of every device
 * feature selector of the home (hundreds of them) in several triggers and actions:
 * repeating it inline multiplies the size of the request sent to the AI.
 * @param {object} parameters - JSON Schema of the tool parameters, modified in place.
 * @param {number} [minSize] - Minimum size (serialized JSON length) of a sub-schema to extract.
 * @returns {object} The same JSON Schema, with the repeated large sub-schemas in $defs.
 * @example
 * extractRepeatedSchemas({ type: 'object', properties: { a: bigEnum, b: bigEnum } });
 */
function extractRepeatedSchemas(parameters, minSize = REPEATED_SCHEMA_MIN_SIZE) {
  // Extract the largest repeated sub-schema first: the repetitions nested in it disappear with it.
  let largest = findLargestRepeatedSchema(parameters, minSize);
  while (largest) {
    const [serialized, locations] = largest;
    // Name it after the property it describes most often.
    const propertyNameCounts = new Map();
    locations.forEach(({ propertyName = 'shared' }) => {
      propertyNameCounts.set(propertyName, (propertyNameCounts.get(propertyName) || 0) + 1);
    });
    const [[propertyName]] = [...propertyNameCounts.entries()].sort(([, a], [, b]) => b - a);
    // eslint-disable-next-line no-param-reassign
    parameters.$defs = parameters.$defs || {};
    const baseName = propertyName.replace(/[^a-zA-Z0-9_]/g, '_');
    let name = baseName;
    for (let suffix = 2; parameters.$defs[name]; suffix += 1) {
      name = `${baseName}_${suffix}`;
    }
    // eslint-disable-next-line no-param-reassign
    parameters.$defs[name] = JSON.parse(serialized);
    locations.forEach(({ parent, key }) => {
      // eslint-disable-next-line no-param-reassign
      parent[key] = { $ref: `#/$defs/${name}` };
    });
    largest = findLargestRepeatedSchema(parameters, minSize);
  }
  return parameters;
}

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
    let parameters = extractRepeatedSchemas(
      removeUnsupportedSchemaKeywords(z.object(config.inputSchema).toJSONSchema()),
    );
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
  removeUnsupportedSchemaKeywords,
  extractRepeatedSchemas,
};
