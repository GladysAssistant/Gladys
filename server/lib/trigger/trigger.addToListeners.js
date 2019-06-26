/**
 * @description Add a trigger from the DB to the listeners
 * @param {Object} trigger - A trigger object from the db.
 * @example
 * triggerManager.addToListeners(trigger);
 */
function addToListeners(trigger) {
  // if the dictionnary doesn't have this event already, we create the array of listeners
  if (!this.triggerDictionnary[trigger.type]) {
    this.triggerDictionnary[trigger.type] = [];
  }
  // we verify that the trigger is not already in the dictionnary
  const triggerIndex = this.triggerDictionnary[trigger.type].findIndex((elem) => elem.id === trigger.id);
  // if the trigger was found, we replace it. Otherwise, we push it at the end
  if (triggerIndex !== -1) {
    this.triggerDictionnary[trigger.type][triggerIndex] = trigger;
  } else {
    this.triggerDictionnary[trigger.type].push(trigger);
  }
  return null;
}

module.exports = {
  addToListeners,
};
