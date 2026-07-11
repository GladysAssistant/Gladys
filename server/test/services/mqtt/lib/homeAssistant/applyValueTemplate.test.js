const { expect } = require('chai');

const { applyValueTemplate } = require('../../../../../services/mqtt/lib/homeAssistant/applyValueTemplate');

describe('mqttHandler.homeAssistant.applyValueTemplate', () => {
  it('should return the raw message when there is no template', () => {
    expect(applyValueTemplate(undefined, '12.5')).to.equal('12.5');
  });

  it('should extract a value_json path', () => {
    expect(applyValueTemplate('{{ value_json.temperature }}', '{"temperature": 21.5}')).to.equal(21.5);
  });

  it('should extract a nested value_json path with filters', () => {
    expect(applyValueTemplate('{{ value_json.data.temp | round(1) }}', '{"data": {"temp": 21.55}}')).to.equal(21.55);
  });

  it('should extract a value_json bracket path', () => {
    expect(applyValueTemplate('{{ value_json["my key"] }}', '{"my key": 42}')).to.equal(42);
  });

  it('should return undefined when the message is not a valid JSON', () => {
    expect(applyValueTemplate('{{ value_json.temperature }}', 'not-a-json')).to.equal(undefined);
  });

  it('should return the raw message for value based templates', () => {
    expect(applyValueTemplate('{{ value }}', 'ON')).to.equal('ON');
  });
});
