const { EVENTS } = require('../../utils/constants');
const { compare } = require('../../utils/compare');

const triggersFunc = {
  [EVENTS.DEVICE.NEW_STATE]: (event, trigger) => {
    // we check that we are talking about the same event
    if (event.device_feature !== trigger.device_feature) {
      return false;
    }
    // we compare the value with the expected value
    return compare(trigger.operator, event.last_value, trigger.value);
  },
};

module.exports = {
  triggersFunc,
};
