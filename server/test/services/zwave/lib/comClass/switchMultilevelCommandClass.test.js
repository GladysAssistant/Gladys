const { expect } = require('chai');

const { SwitchMultilevelCommandClass } = require('../../../../../services/zwave/lib/comClass/switchMultilevelCommandClass');

describe('zWave Command Class Switch Multi Level', () => {
    it('should returns the valid commClassId', () => {
        expect(SwitchMultilevelCommandClass.getId()).equals(0x38);
    })
});