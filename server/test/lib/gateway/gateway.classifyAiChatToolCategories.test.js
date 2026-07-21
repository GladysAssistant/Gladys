const { fake, assert } = require('sinon');
const { expect } = require('chai');

const {
  classifyAiChatToolCategories,
  parseToolCategoriesResponse,
  filterMcpToolsByCategories,
  buildRouterUserContent,
} = require('../../../lib/gateway/gateway.classifyAiChatToolCategories');

describe('gateway.classifyAiChatToolCategories', () => {
  describe('parseToolCategoriesResponse', () => {
    it('should parse a valid JSON object response', () => {
      const categories = parseToolCategoriesResponse('{"categories": ["scenes", "device_control"]}');
      expect(categories).to.deep.equal(['scenes', 'device_control']);
    });

    it('should parse a JSON response wrapped in code fences and text', () => {
      const categories = parseToolCategoriesResponse(
        'Here is the classification:\n```json\n{"categories": ["device_query"]}\n```',
      );
      expect(categories).to.deep.equal(['device_query']);
    });

    it('should parse a bare JSON array response', () => {
      const categories = parseToolCategoriesResponse('["web_and_time"]');
      expect(categories).to.deep.equal(['web_and_time']);
    });

    it('should normalize case, trim values and deduplicate', () => {
      const categories = parseToolCategoriesResponse('{"categories": [" SCENES ", "scenes", "Device_Control"]}');
      expect(categories).to.deep.equal(['scenes', 'device_control']);
    });

    it('should ignore unknown categories', () => {
      const categories = parseToolCategoriesResponse('{"categories": ["scenes", "banana"]}');
      expect(categories).to.deep.equal(['scenes']);
    });

    it('should return null when only unknown categories are present', () => {
      expect(parseToolCategoriesResponse('{"categories": ["banana"]}')).to.equal(null);
    });

    it('should return null on plain text response', () => {
      expect(parseToolCategoriesResponse('I think this is about scenes.')).to.equal(null);
    });

    it('should return null on invalid JSON', () => {
      expect(parseToolCategoriesResponse('{"categories": [scenes]}')).to.equal(null);
    });

    it('should return null when categories is not an array', () => {
      expect(parseToolCategoriesResponse('{"categories": "scenes"}')).to.equal(null);
    });

    it('should return null on empty or missing response', () => {
      expect(parseToolCategoriesResponse('')).to.equal(null);
      expect(parseToolCategoriesResponse(null)).to.equal(null);
      expect(parseToolCategoriesResponse(undefined)).to.equal(null);
    });
  });

  describe('filterMcpToolsByCategories', () => {
    const mcpTools = [
      { intent: 'scene.create', config: { categories: ['scenes'] } },
      { intent: 'scene.start', config: { categories: ['scenes', 'device_control', 'other'] } },
      { intent: 'device.turn-on-off', config: { categories: ['device_control', 'other'] } },
      { intent: 'device.get-history', config: { categories: ['device_query', 'other'] } },
      { intent: 'some.future-tool', config: {} },
    ];

    it('should keep only tools matching selected categories, plus untagged tools', () => {
      const filtered = filterMcpToolsByCategories(mcpTools, ['device_control']);
      expect(filtered.map((t) => t.intent)).to.deep.equal(['scene.start', 'device.turn-on-off', 'some.future-tool']);
    });

    it('should union tools of multiple categories', () => {
      const filtered = filterMcpToolsByCategories(mcpTools, ['device_control', 'device_query']);
      expect(filtered.map((t) => t.intent)).to.deep.equal([
        'scene.start',
        'device.turn-on-off',
        'device.get-history',
        'some.future-tool',
      ]);
    });

    it('should exclude the scene_create tool for the other category', () => {
      const filtered = filterMcpToolsByCategories(mcpTools, ['other']);
      expect(filtered.map((t) => t.intent)).to.not.include('scene.create');
    });

    it('should return all tools when categories is null or empty', () => {
      expect(filterMcpToolsByCategories(mcpTools, null)).to.deep.equal(mcpTools);
      expect(filterMcpToolsByCategories(mcpTools, [])).to.deep.equal(mcpTools);
    });

    it('should return all tools when filtering removes everything', () => {
      const onlyTagged = [{ intent: 'scene.create', config: { categories: ['scenes'] } }];
      expect(filterMcpToolsByCategories(onlyTagged, ['device_query'])).to.deep.equal(onlyTagged);
    });
  });

  describe('buildRouterUserContent', () => {
    it('should include the current message', () => {
      expect(buildRouterUserContent('Turn on the light')).to.equal('User message: Turn on the light');
    });

    it('should include a compact truncated history', () => {
      const previousQuestions = [
        { question: 'q1', answer: 'a1' },
        { question: 'q2', answer: 'a2' },
        { question: 'q3', answer: 'a3' },
        { question: `q4${'x'.repeat(300)}`, answer: null },
      ];
      const content = buildRouterUserContent('And in the kitchen?', previousQuestions);
      expect(content).to.not.include('q1');
      expect(content).to.include('Previous user message: q2');
      expect(content).to.include('Previous assistant reply: a3');
      expect(content).to.include('...');
      expect(content).to.include('User message: And in the kitchen?');
    });
  });

  describe('classifyAiChatToolCategories', () => {
    it('should classify a message with a single fast model call without tools', async () => {
      const aiChat = fake.resolves({
        choices: [{ message: { content: '{"categories": ["scenes"]}' } }],
      });

      const categories = await classifyAiChatToolCategories.call(
        { aiChat },
        { messageText: 'Create a scene that turns off the lights at 23:00', previousQuestions: [] },
      );

      expect(categories).to.deep.equal(['scenes']);
      assert.calledOnce(aiChat);
      const request = aiChat.getCall(0).args[0];
      expect(request).to.not.have.property('tools');
      expect(request).to.not.have.property('model');
      expect(request.messages[0].role).to.equal('system');
      expect(request.messages[1].content).to.include('Create a scene that turns off the lights at 23:00');
    });

    it('should return null when the message is empty', async () => {
      const aiChat = fake.resolves({});
      const categories = await classifyAiChatToolCategories.call({ aiChat }, { messageText: '  ' });
      expect(categories).to.equal(null);
      assert.notCalled(aiChat);
    });

    it('should return null when the router response is not parseable', async () => {
      const aiChat = fake.resolves({
        choices: [{ message: { content: 'This is about scenes probably' } }],
      });
      const categories = await classifyAiChatToolCategories.call({ aiChat }, { messageText: 'Hello' });
      expect(categories).to.equal(null);
    });

    it('should return null when the router call fails', async () => {
      const aiChat = fake.rejects(new Error('gateway down'));
      const categories = await classifyAiChatToolCategories.call({ aiChat }, { messageText: 'Hello' });
      expect(categories).to.equal(null);
    });
  });
});
