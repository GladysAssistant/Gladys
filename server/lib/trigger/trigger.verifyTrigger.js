const { verifiers } = require('./trigger.verifiers');
const { conditionVerifiers } = require('./trigger.conditionVerifiers');

let validateConditions;

/**
 * @description Evaluate a condition
 * @param {Object} stateManager - A StateManager instance.
 * @param {Object} event - The event triggered.
 * @param {Object} condition - A condition object.
 * @returns {boolean} Return true if condition is valid.
 * @example
 * validateCondition(stateManager, event, condition);
 */
function validateCondition(stateManager, event, condition) {
  const valid = conditionVerifiers[condition.type](stateManager, event, condition);
  if (condition.or) {
    return valid || validateConditions(stateManager, event, condition.or);
  }

  return valid;
}

/**
 * @description Evaluate if an ensemble of conditions are true.
 * @param {Object} stateManager - A StateManager instance.
 * @param {Object} event - The event triggered.
 * @param {Array} conditions - An array of parallel conditions to evaludate.
 * @example
 * validateConditions(stateManager, event, conditions);
 */
validateConditions = function validateConditionsFunc(stateManager, event, conditions) {
  let conditionsValid = true;
  let i = 0;
  while (conditionsValid && i < conditions.length) {
    conditionsValid = validateCondition(stateManager, event, conditions[i]);
    i += 1;
  }
  return conditionsValid;
};

/**
 * @description Verify if a trigger and all its conditions are valid.
 * @param {Object} stateManager - A StateManager object.
 * @param {string} type - The type of the event.
 * @param {Object} trigger - The trigger object.
 * @param {Object} [event] - The event object.
 * @returns {boolean} Return true if trigger and conditions are valid.
 * @example
 * verifyTrigger('sun.sunrise', {
 *  conditions: []
 * }, {});
 */
function verifyTrigger(stateManager, type, trigger, event) {
  const valid = verifiers[type] ? verifiers[type](trigger, event) : true;
  if (!valid) {
    return false;
  }
  const conditionsValid = validateConditions(stateManager, event, trigger.conditions);
  return conditionsValid;
}

module.exports = {
  verifyTrigger,
};
