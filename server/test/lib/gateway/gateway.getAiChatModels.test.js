const { expect } = require('chai');

const { getAiChatModels } = require('../../../lib/gateway/gateway.getAiChatModels');
const { DEFAULT_TEXT_MODEL } = require('../../../utils/aiChatModels');

describe('gateway.getAiChatModels', () => {
  it('should return the allowed models list', async () => {
    const result = await getAiChatModels.call({});
    expect(result).to.have.property('models');
    expect(result.models.find((model) => model.id === DEFAULT_TEXT_MODEL)).to.deep.equal({
      id: DEFAULT_TEXT_MODEL,
      vision: true,
      priceTier: 1,
      priceLabel: '€',
    });
  });
});
