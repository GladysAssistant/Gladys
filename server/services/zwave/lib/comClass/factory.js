const { defaultCommandClass } = require('./defaultCommandClass');
const { switchMultilevelCommandClass } = require('./switchMultilevelCommandClass');

const commandClasses = {};
commandClasses[switchMultilevelCommandClass.getId()] = switchMultilevelCommandClass;

const commandClassKnownIdList = Object.keys(commandClasses).map((comClass) => parseInt(comClass, 10));

/**
 * @description Get the command class corresponding to comClass.
 * 
 * @param {number} comClass - Command Class Id.
 * 
 * @returns {Object} The command class.
 * @example getCommandClass(0x38);
 */
function getCommandClass(comClass) {
    if (commandClassKnownIdList.indexOf(comClass) === -1) {
        return defaultCommandClass;
    }

    return commandClasses[comClass];
}

module.exports = {
    getCommandClass
};