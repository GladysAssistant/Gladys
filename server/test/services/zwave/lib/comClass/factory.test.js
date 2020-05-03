const { expect } = require('chai');
const { COMMAND_CLASSES } = require('../../../../../services/zwave/lib/constants');
const { getCommandClass } = require('../../../../../services/zwave/lib/comClass/factory');

describe('zWave Command Class Factory', () => {
    it('should returns the valid commClass for a valid comClassId', () => {
        const commandClassInstance = getCommandClass(COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL);

        expect(commandClassInstance).to.be.a('object');
        expect(commandClassInstance.getId()).equal(COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL);
    });

    it('should returns the default commClass for an unknown comClassId', () => {
        const commandClassInstance = getCommandClass(0x01);

        expect(commandClassInstance).to.be.a('object');
        expect(commandClassInstance.getId()).equal(-1);
    });
});