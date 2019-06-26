const { STATES, CONDITIONS } = require('../../utils/constants');

const conditionVerifiers = {
  [CONDITIONS.HOUSE_ALARM.IS_ARMED]: (stateManager, event, condition) =>
    stateManager.getKey('house', condition.house, 'alarm') === STATES.HOUSE_ALARM.ARMED,
  [CONDITIONS.HOUSE_ALARM.IS_DISARMED]: (stateManager, event, condition) =>
    stateManager.getKey('house', condition.house, 'alarm') === STATES.HOUSE_ALARM.DISARMED,
};

module.exports = {
  conditionVerifiers,
};
