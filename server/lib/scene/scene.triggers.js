const { EVENTS } = require('../../utils/constants');
const { compare } = require('../../utils/compare');

const triggersFunc = {
  [EVENTS.DEVICE.NEW_STATE]: (event, trigger) => {
    // we check that we are talking about the same event
    if (event.device_feature !== trigger.device_feature) {
      return false;
    }
    const newValueValidateRule = compare(trigger.operator, event.last_value, trigger.value);
    // if the trigger is only a threshold_only, we only validate the trigger is the rule has been validated
    // and was not validated with the previous value
    if (trigger.threshold_only === true && !Number.isNaN(event.previous_value)) {
      const previousValueValidateRule = compare(trigger.operator, event.previous_value, trigger.value);
      return newValueValidateRule && !previousValueValidateRule;
    }
    return newValueValidateRule;
  },
  [EVENTS.TIME.CHANGED]: (event, trigger) => event.key === trigger.key,
};

module.exports = {
  triggersFunc,
};
