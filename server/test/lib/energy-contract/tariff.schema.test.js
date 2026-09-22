const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const constants = require('../../../lib/energy-contract/tariff.constants');

// tariff.schema.json is the JSON Schema the ecosystem validates against
// (energy-contracts catalogue, store indexer, SDK); tariff.validate.js is its
// Joi mirror in the core. This test keeps every enumerated value and limit in sync.
describe('energy-contract tariff.schema.json', () => {
  const schema = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../lib/energy-contract/tariff.schema.json'), 'utf8'),
  );
  const { definitions } = schema;
  const componentVariants = definitions.component.oneOf;

  it('should mirror the constants of the Joi validator', () => {
    expect(schema.properties.tariff_version.const).to.equal(constants.TARIFF_VERSION);
    expect(definitions.component.properties.kind.enum).to.deep.equal(Object.values(constants.TARIFF_COMPONENT_KINDS));
    expect(definitions.conditions.properties.weekdays.items.enum).to.deep.equal(constants.TARIFF_WEEKDAYS);
    expect(definitions.conditions.properties.tier.properties.cumulative.enum).to.deep.equal(
      Object.values(constants.TARIFF_CUMULATIVE_SCOPES),
    );
    expect(componentVariants[1].properties.per.enum).to.deep.equal(Object.values(constants.TARIFF_FIXED_PERIODS));
    expect(componentVariants[3].properties.per.enum).to.deep.equal(Object.values(constants.TARIFF_DEMAND_PERIODS));
    expect(componentVariants[3].properties.aggregation.enum).to.deep.equal(
      Object.values(constants.TARIFF_DEMAND_AGGREGATIONS),
    );
    expect(componentVariants[3].properties.aggregation.default).to.equal(constants.TARIFF_DEMAND_AGGREGATIONS.MAX);
  });
  it('should mirror the patterns', () => {
    expect(definitions.calendarKey.pattern).to.equal(constants.CALENDAR_KEY_REGEX.source);
    expect(definitions.componentKey.pattern).to.equal(constants.COMPONENT_KEY_REGEX.source);
    expect(definitions.time.pattern).to.equal(constants.TIME_REGEX.source);
    expect(definitions.monthDay.pattern).to.equal(constants.MONTH_DAY_REGEX.source);
    expect(definitions.date.pattern).to.equal(constants.DATE_REGEX.source);
    expect(definitions.calendarCondition.propertyNames.pattern).to.equal(constants.CALENDAR_KEY_REGEX.source);
  });
  it('should mirror the limits', () => {
    expect(schema.properties.components.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_COMPONENTS);
    expect(schema.properties.calendars.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_CALENDARS);
    expect(componentVariants[0].properties.rules.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_RULES_PER_COMPONENT);
    expect(definitions.conditions.properties.time.maxItems).to.equal(constants.TARIFF_LIMITS.MAX_TIME_INTERVALS);
    expect(definitions.calendarCondition.maxProperties).to.equal(constants.TARIFF_LIMITS.MAX_CALENDARS);
    expect(definitions.calendarCondition.additionalProperties.oneOf[1].maxItems).to.equal(
      constants.TARIFF_LIMITS.MAX_CALENDAR_VALUES,
    );
    expect(definitions.label.maxLength).to.equal(constants.TARIFF_LIMITS.MAX_LABEL_LENGTH);
  });
});
