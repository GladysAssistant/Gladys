/* eslint-disable no-restricted-syntax */
const { expect } = require('chai');
const { assert } = require('sinon');
const EventEmitter = require('events');
const {DEVICE_FEATURE_CATEGORIES} = require('../../../../utils/constants');


const RflinkManager = require('../../../../services/rflink/lib');
const DEVICES = require('./devicesToTest.test');
const RflinkMock = require('../rflinkMock.test');

describe('Rflink Manager Commands', () => {
    const gladys = {
      event: new EventEmitter(),
    };
    const rflinkManager = new RflinkManager(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    rflinkManager.connected = true;
    
    it('should connect to the Rflink Gateway', () => {
        rflinkManager.connect('COM8');
    });

    it('should disconnect from the Rflink Gateway', () => {
        rflinkManager.disconnect();
    });

    it('should listen', () => {
        rflinkManager.listen();
    });

    it('should get devices', ()=> {
        rflinkManager.getDevices();
    });

    it('should pair Milights', () => {
        rflinkManager.pair('F746', '1');
    });

    it('should unpair Milights', () => {
        rflinkManager.unpair('F746', '1');
    });

    DEVICES.forEach((device) => {
        device.features.forEach((feature) => {
            if (feature !==undefined) {
                it('should change value of a device', () => {
                    if (feature.read_only === false) {                                               // it's not a sensor
                        if (feature.type === 'binary' || feature.type === 'decimal') {
                            return rflinkManager.setValue(device, feature, 1);
                        }
                            return 'error';
                    }
                });
            }
        });
    });




    });
    
