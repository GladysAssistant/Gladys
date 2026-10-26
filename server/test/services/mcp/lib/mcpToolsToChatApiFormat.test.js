const { expect } = require('chai');
const z = require('../../../../services/mcp/node_modules/zod/v4');
const {
  applyDeviceTargetingSchema,
  toolNameFromIntent,
  mcpToolsToChatApiFormat,
  removeUnsupportedSchemaKeywords,
  extractRepeatedSchemas,
} = require('../../../../services/mcp/lib/mcpToolsToChatApiFormat');
const { createSceneCreateInputSchema } = require('../../../../services/mcp/lib/sceneSchemas');

const bigEnum = (prefix) => ({
  type: 'string',
  enum: Array.from({ length: 50 }, (_, index) => `${prefix}-device-feature-${index}`),
});

describe('mcpToolsToChatApiFormat', () => {
  it('should convert intent names to chat API function names', () => {
    expect(toolNameFromIntent('device.turn-on-off')).to.equal('device_turn_on_off');
  });

  it('should convert MCP tools to chat API tools', () => {
    const tools = mcpToolsToChatApiFormat([
      {
        intent: 'device.turn-on-off',
        config: {
          title: 'Turn on/off',
          requireDeviceTargeting: true,
          inputSchema: { action: z.enum(['on', 'off']), device: z.string().optional() },
        },
      },
      { intent: 'scene.start', config: { title: 'Start scene', inputSchema: {} } },
      { intent: 'time.compare-times', config: { inputSchema: {} } },
    ]);

    expect(tools[0].function.name).to.equal('device_turn_on_off');
    expect(tools[0].function.description).to.equal('Turn on/off');
    expect(tools[0].function.parameters).not.to.have.property('$schema');
    expect(tools[0].function.parameters.anyOf).to.have.lengthOf(2);
    expect(tools[1].function.description).to.equal('Start scene');
    expect(tools[2].function.description).to.equal('time.compare-times');
  });

  it('should send a scene.create schema the AI provider can compile, without repeating the selectors', () => {
    const deviceFeatureSelectors = Array.from({ length: 300 }, (_, index) => `device-feature-${index}`);
    const schema = createSceneCreateInputSchema(
      ['scene-a'],
      ['john'],
      ['main-house'],
      ['light-a'],
      ['switch-a', ''],
      [],
      deviceFeatureSelectors,
    );

    const [tool] = mcpToolsToChatApiFormat([{ intent: 'scene.create', config: { inputSchema: schema.shape } }]);
    const serialized = JSON.stringify(tool.function.parameters);

    // "Grammar error: Unimplemented keys: [\"propertyNames\"]" from the AI provider
    expect(serialized).not.to.include('propertyNames');
    expect(serialized).not.to.include('""');
    expect(tool.function.parameters.$defs.device_feature).to.deep.equal({
      type: 'string',
      enum: deviceFeatureSelectors,
    });
    expect(serialized.split('device-feature-299')).to.have.lengthOf(2);
    expect(serialized).to.include('"$ref":"#/$defs/device_feature"');
  });
});

describe('removeUnsupportedSchemaKeywords', () => {
  it('should remove propertyNames at any depth', () => {
    const schema = {
      type: 'object',
      properties: {
        fields: {
          type: 'object',
          propertyNames: { type: 'string', pattern: '^[a-z0-9_]+$' },
          additionalProperties: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        },
      },
      $defs: { record: { type: 'object', propertyNames: { pattern: '^[a-z]+$' } } },
    };

    expect(removeUnsupportedSchemaKeywords(schema)).to.deep.equal({
      type: 'object',
      properties: {
        fields: {
          type: 'object',
          additionalProperties: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        },
      },
      $defs: { record: { type: 'object' } },
    });
  });

  it('should keep a property named like an unsupported keyword and the data keywords', () => {
    const schema = {
      type: 'object',
      properties: {
        propertyNames: { type: 'string', enum: ['propertyNames'] },
        settings: { const: { propertyNames: true }, default: null },
      },
      required: ['propertyNames'],
    };

    expect(removeUnsupportedSchemaKeywords(schema)).to.deep.equal(schema);
  });
});

describe('extractRepeatedSchemas', () => {
  it('should write a large repeated sub-schema once in $defs, named after its property', () => {
    const parameters = {
      type: 'object',
      properties: {
        triggers: {
          type: 'array',
          items: {
            anyOf: [
              { type: 'object', properties: { type: { const: 'device.new-state' }, device_feature: bigEnum('a') } },
              {
                type: 'object',
                properties: {
                  type: { const: 'user.check-presence' },
                  device_features: { type: 'array', items: bigEnum('a') },
                },
              },
            ],
          },
        },
        actions: { $ref: '#/$defs/actions_union' },
      },
      $defs: {
        actions_union: {
          oneOf: [
            { type: 'object', properties: { type: { const: 'device.get-value' }, device_feature: bigEnum('a') } },
          ],
        },
      },
    };

    const result = extractRepeatedSchemas(parameters);

    expect(result.$defs.device_feature).to.deep.equal(bigEnum('a'));
    const ref = { $ref: '#/$defs/device_feature' };
    expect(result.properties.triggers.items.anyOf[0].properties.device_feature).to.deep.equal(ref);
    expect(result.properties.triggers.items.anyOf[1].properties.device_features.items).to.deep.equal(ref);
    expect(result.$defs.actions_union.oneOf[0].properties.device_feature).to.deep.equal(ref);
  });

  it('should keep small or unique sub-schemas inline', () => {
    const parameters = {
      type: 'object',
      properties: {
        room: { type: ['string', 'null'], enum: ['kitchen', 'living-room'] },
        other_room: { type: ['string', 'null'], enum: ['kitchen', 'living-room'] },
        device: bigEnum('a'),
        nothing: null,
      },
    };

    expect(extractRepeatedSchemas(JSON.parse(JSON.stringify(parameters)))).to.deep.equal(parameters);
  });

  it('should give a unique name to each extracted sub-schema', () => {
    const parameters = {
      type: 'object',
      properties: {
        device: { anyOf: [bigEnum('a'), bigEnum('b'), bigEnum('b')] },
        'device-list': { type: 'array', items: { anyOf: [bigEnum('a'), bigEnum('a')] } },
        any: { patternProperties: { '^x': bigEnum('c'), '^y': bigEnum('c') } },
      },
      $defs: { device: { type: 'string' } },
    };

    const result = extractRepeatedSchemas(parameters);

    expect(result.$defs).to.deep.equal({
      device: { type: 'string' },
      device_list: bigEnum('a'),
      device_2: bigEnum('b'),
      any: bigEnum('c'),
    });
  });

  it('should name a sub-schema repeated outside of any property "shared"', () => {
    const parameters = { anyOf: [bigEnum('a'), bigEnum('a')] };

    const result = extractRepeatedSchemas(parameters);

    expect(result).to.deep.equal({
      anyOf: [{ $ref: '#/$defs/shared' }, { $ref: '#/$defs/shared' }],
      $defs: { shared: bigEnum('a') },
    });
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
