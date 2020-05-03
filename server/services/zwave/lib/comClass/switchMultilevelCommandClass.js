const SwitchMultilevelCommandClass = function SwitchMultilevelCommandClass() {

};

/**
 * @description Get the command class ID.
 * 
 * @returns {number} - Command Class ID.
 * @example SwitchMultilevelCommandClass.getId();
 */
SwitchMultilevelCommandClass.getId = function SwitchMultilevelCommandClassGetId() {
    return 0x38;
};

SwitchMultilevelCommandClass.prototype = {

};

module.exports = {
    SwitchMultilevelCommandClass,
};