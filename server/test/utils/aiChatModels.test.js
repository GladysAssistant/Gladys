const { expect } = require('chai');

const {
  DEFAULT_TEXT_MODEL,
  DEFAULT_VISION_MODEL,
  isAllowedAiChatModel,
  resolveAiChatModel,
  getAiChatModelsList,
} = require('../../utils/aiChatModels');

describe('aiChatModels utils', () => {
  it('should expose default text and vision models in the allowed list', () => {
    expect(isAllowedAiChatModel(DEFAULT_TEXT_MODEL)).to.equal(true);
    expect(isAllowedAiChatModel(DEFAULT_VISION_MODEL)).to.equal(true);
  });

  it('should reject unknown models', () => {
    expect(isAllowedAiChatModel('unknown-model')).to.equal(false);
    expect(isAllowedAiChatModel(null)).to.equal(false);
  });

  it('should resolve auto to undefined', () => {
    expect(resolveAiChatModel('auto')).to.equal(undefined);
    expect(resolveAiChatModel(null)).to.equal(undefined);
    expect(resolveAiChatModel(undefined)).to.equal(undefined);
    expect(resolveAiChatModel('')).to.equal(undefined);
  });

  it('should resolve allowed models', () => {
    expect(resolveAiChatModel(DEFAULT_TEXT_MODEL)).to.equal(DEFAULT_TEXT_MODEL);
    expect(resolveAiChatModel('gpt-oss-120b')).to.equal('gpt-oss-120b');
  });

  it('should return null for invalid models', () => {
    expect(resolveAiChatModel('not-a-model')).to.equal(null);
  });

  it('should list all allowed models with vision metadata', () => {
    const models = getAiChatModelsList();
    expect(models.length).to.be.greaterThan(0);
    expect(models.find((model) => model.id === DEFAULT_TEXT_MODEL)).to.deep.equal({
      id: DEFAULT_TEXT_MODEL,
      vision: true,
    });
    expect(models.find((model) => model.id === 'gpt-oss-120b')).to.deep.equal({
      id: 'gpt-oss-120b',
      vision: false,
    });
  });
});
