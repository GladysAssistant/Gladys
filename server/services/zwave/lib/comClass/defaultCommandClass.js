const DefaultCommandClass = function DefaultCommandClass() {};

DefaultCommandClass.prototype = {
  /**
   * @description Get the command class ID.
   *
   * @returns {number} - Command Class ID.
   *
   * @example commandClass.getId();
   */
  getId: function getId() {
    return -1;
  },
  /**
   * @description Get the value following a value changed event.
   *
   * @param {Object} node - The node the value changed occurs.
   * @param {Object} valueChanged - The value changed.
   *
   * @returns {Object} - A zWave value.
   *
   * @example
   *     const changedValue = comClass.getChangedValue(node, value);
   */
  getChangedValue: function getChangedValue(node, valueChanged) {
    return valueChanged;
  },
};

module.exports = {
  defaultCommandClass: new DefaultCommandClass(),
};
