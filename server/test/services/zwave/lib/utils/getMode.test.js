const { expect } = require('chai');

const { getMode } = require('../../../../../services/zwave/lib/utils/getMode');
const { VALUE_MODES } = require('../../../../../services/zwave/lib/constants');

describe('zWave getMode Utils', () => {
    const readOnlyValue = {
        value_id: '1-32-1-0',
        node_id: 1,
        class_id: 32,
        type: 'byte',
        genre: 'basic',
        instance: 1,
        index: 0,
        label: 'Basic',
        units: '',
        help: '',
        read_only: true,
        write_only: false,
        min: 0,
        max: 255,
        is_polled: false,
        value: 0
    };
    const writeOnlyValue = {
        value_id: '1-32-1-0',
        node_id: 1,
        class_id: 32,
        type: 'byte',
        genre: 'basic',
        instance: 1,
        index: 0,
        label: 'Basic',
        units: '',
        help: '',
        read_only: false,
        write_only: true,
        min: 0,
        max: 255,
        is_polled: false,
        value: 0
    };
    const readWriteValue = {
        value_id: '1-32-1-0',
        node_id: 1,
        class_id: 32,
        type: 'byte',
        genre: 'basic',
        instance: 1,
        index: 0,
        label: 'Basic',
        units: '',
        help: '',
        read_only: false,
        write_only: false,
        min: 0,
        max: 255,
        is_polled: false,
        value: 0
    };

    it('should return READ ONLY', () => {
        const mode = getMode(readOnlyValue);

        expect(mode).equals(VALUE_MODES.READ_ONLY);
    });

    it('should return WRITE ONLY', () => {
        const mode = getMode(writeOnlyValue);

        expect(mode).equals(VALUE_MODES.WRITE_ONLY);
    });

    it('should return READ WRITE', () => {
        expect(getMode(readWriteValue)).equals(VALUE_MODES.READ_WRITE);
    });
});