const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');
const DEVICES = require('./devicesToTest.test');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake, stub } = sinon;

describe('RFLinkHandler.setValue', () => {
  let gladys;
  let rflinkHandler;

  beforeEach(() => {
    sinon.reset();
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    rflinkHandler.sendUsb = {
      write: stub()
        .withArgs('msg')
        .resolves(),
    };
  });

  it('should send a message to change value of a SWITCH where feature is binary and state is 0', async () => {
    const device = DEVICES[0];
    const deviceFeature = {
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    };
    const state = 0;
    const expectedMsg = '10;Tristate;86aa7;11;OFF;\n';
    await rflinkHandler.setValue(device, deviceFeature, state);

    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to change value of a SWITCH where feature is binary and state is 1', async () => {
    const device = DEVICES[0];
    const deviceFeature = {
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    };
    const state = 1;
    const expectedMsg = '10;Tristate;86aa7;11;ON;\n';
    await rflinkHandler.setValue(device, deviceFeature, state);

    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to change value of a SWITCH where feature is binary and state is undefined', async () => {
    const device = DEVICES[0];
    const deviceFeature = {
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    };
    const state = 'undefined';
    const expectedMsg = '10;Tristate;86aa7;11;undefined;\n';
    await rflinkHandler.setValue(device, deviceFeature, state);

    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to change value of a BUTTON where feature is binary and state is 0', async () => {
    const device = DEVICES[0];
    const deviceFeature = {
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
    };
    const state = 0;
    const expectedMsg = '10;Tristate;86aa7;11;DOWN;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to change value of a BUTTON where feature is binary and state is 1', async () => {
    const device = DEVICES[0];
    const deviceFeature = {
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
    };
    const state = 1;
    const expectedMsg = '10;Tristate;86aa7;11;UP;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to power on (state 1) a Milight device', async () => {
    // 10;MiLightv1;9926;00;fed0;ON;
    const device = DEVICES[2];
    const deviceFeature = {
      external_id: `rflink:86aa70:power:12:milight`,
    };
    const state = 1;
    const expectedMsg = '10;MiLightv1;86aa70;000;34BC;ON;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to power off (state 0) a Milight device', async () => {
    const device = DEVICES[2];
    const deviceFeature = {
      external_id: `rflink:86aa70:power:12:milight`,
    };
    const state = 0;
    const expectedMsg = '10;MiLightv1;86aa70;000;34BC;OFF;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message with non standard state to a Milight device', async () => {
    // 10;MiLightv1;9926;00;fed0;ON;
    const device = DEVICES[2];
    const deviceFeature = {
      external_id: `rflink:86aa70:power:12:milight`,
    };
    const state = 'undefined';
    const expectedMsg = '10;MiLightv1;86aa70;000;34BC;ON;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to change the color of a Milight device', async () => {
    const device = DEVICES[2];
    const deviceFeature = {
      external_id: `rflink:86aa70:color:12:milight`,
    };
    const state = 10;
    const expectedMsg = '10;MiLightv1;86aa70;000;64;COLOR;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to change the brightness of a Milight device', async () => {
    const device = DEVICES[2];
    const deviceFeature = {
      external_id: `rflink:86aa70:brightness:12:milight`,
    };
    const state = 10;
    const expectedMsg = '10;MiLightv1;86aa70;000;3417;BRIGHT;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to change the brightness of a Milight device and keep the previous color set', async () => {
    const device = DEVICES[2];
    const featureIndex = device.features.findIndex((f) => f.type === 'color');
    device.features[featureIndex].last_value = '15666';
    const deviceFeature = {
      external_id: `rflink:86aa70:brightness:12:milight`,
    };
    const state = 10;
    const expectedMsg = '10;MiLightv1;86aa70;000;3917;BRIGHT;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });

  it('should send a message to access milight-mode of a Milight device', async () => {
    const device = DEVICES[2];
    const deviceFeature = {
      external_id: `rflink:86aa70:milight-mode:12:milight`,
    };
    const state = 4;
    const expectedMsg = '10;MiLightv1;86aa70;000;34BC;MODE4;\n'; // cmd;model;deviceId;external_id last item;cmd
    await rflinkHandler.setValue(device, deviceFeature, state);
    assert.calledOnce(rflinkHandler.sendUsb.write);
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });
});
