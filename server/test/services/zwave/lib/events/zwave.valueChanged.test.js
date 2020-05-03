const { expect } = require('chai');
const { assert, fake } = require('sinon');

const { EVENTS } = require('../../../../../utils/constants');

const ZwaveManager = require('../../../../../services/zwave/lib');
const ZwaveMock = require('../../ZwaveMock.test');
const nodesData = require('../nodesData.json');

describe('zWave value changed', () => {
    let event;
    let zwaveManager;

    beforeEach(() => {
        event = {
            emit: fake.returns(null),
        };
        zwaveManager = new ZwaveManager(ZwaveMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
        zwaveManager.nodes = nodesData;
    });

    it('should not process event on node not ready', () => {
        const valueChanged = {
            value_id: '2-37-1-0',
            node_id: 2,
            class_id: 37,
            type: 'bool',
            genre: 'user',
            instance: 1,
            index: 0,
            label: 'Switch',
            units: '',
            help: '',
            read_only: false,
            write_only: false,
            min: 0,
            max: 0,
            is_polled: false,
            value: false
        };
        zwaveManager.valueChanged(valueChanged.node_id, valueChanged.class_id, valueChanged);

        assert.notCalled(event.emit);
    });

    it('should not process event on already sync value other than READ_ONLY one', () => {
        const valueChanged = {
            value_id: '15-32-1-0',
            node_id: 15,
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
        zwaveManager.valueChanged(valueChanged.node_id, valueChanged.class_id, valueChanged);

        assert.notCalled(event.emit);
    });

    it('should process event on already sync value when READ_ONLY one', () => {
        const valueChanged = {
            value_id: '15-48-1-0',
            node_id: 15,
            class_id: 48,
            type: 'bool',
            genre: 'user',
            instance: 1,
            index: 0,
            label: 'Sensor',
            units: '',
            help: '',
            read_only: true,
            write_only: false,
            min: 0,
            max: 0,
            is_polled: false,
            value: false
        };
        zwaveManager.valueChanged(valueChanged.node_id, valueChanged.class_id, valueChanged);

        assert.calledOnce(event.emit);
        expect(event.emit.args[0][0]).equal(EVENTS.DEVICE.NEW_STATE);
    });
});