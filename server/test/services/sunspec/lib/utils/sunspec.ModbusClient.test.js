const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert, stub } = sinon;

const { ModbusClient } = require('../../../../../services/sunspec/lib/utils/sunspec.ModbusClient');
const { MODEL } = require('../../../../../services/sunspec/lib/sunspec.constants');

describe('SunSpec ModbusClient', () => {
  let modbusClientApi;

  beforeEach(() => {
    modbusClientApi = {
      connectTCP: fake.returns(true),
      close: stub().yields(),
      readHoldingRegisters: fake.returns(true),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not connect - wrong SID', async () => {
    const client = new ModbusClient(modbusClientApi);
    client.readRegisterAsInt32 = stub()
      .onFirstCall()
      .returns(0x00);
    await client.connect('host', 502);
    assert.calledOnce(modbusClientApi.connectTCP);
    expect(client.models).to.deep.equal({});
  });

  it('should not connect - missing model', async () => {
    const client = new ModbusClient(modbusClientApi);
    client.readRegisterAsInt32 = stub()
      .onFirstCall()
      .returns(0x53756e53);
    client.readRegisterAsInt16 = stub()
      .onCall(0) // MODEL_ID
      .returns(2);
    await client.connect('host', 502);
    assert.calledOnce(modbusClientApi.connectTCP);
    expect(client.models).to.deep.equal({});
  });

  it('should connect', async () => {
    const client = new ModbusClient(modbusClientApi);
    client.readRegisterAsInt32 = stub()
      .onFirstCall()
      .returns(0x53756e53);
    client.readRegisterAsInt16 = stub()
      .onCall(0) // MODEL_ID
      .returns(1)
      .onCall(1)
      .returns(5) // MODEL_ID length
      .onCall(2)
      .returns(45) // Next
      .onCall(3)
      .returns(1234) // Next MODEL_ID
      .onCall(4)
      .returns(1234) // Next MODEL_ID length
      .onCall(5)
      .returns(0xffff); // End
    await client.connect('host', 502);
    assert.calledOnce(modbusClientApi.connectTCP);
    expect(client.models).to.deep.equal({
      1: {
        registerStart: 40003,
        registerLength: 5,
      },
      1234: {
        registerStart: 40050,
        registerLength: 1234,
      },
    });
  });

  it('should close', async () => {
    const client = new ModbusClient(modbusClientApi);
    await client.close();
    assert.calledOnce(modbusClientApi.close);
  });

  it('should readModel', async () => {
    const client = new ModbusClient(modbusClientApi);
    modbusClientApi.readHoldingRegisters = stub().yields(null, {
      buffer: Buffer.from([0, 1]),
    });
    client.models = {
      101: {
        registerStart: 0,
        registerLength: 10,
      },
    };
    const res = await client.readModel(101);
    expect(res).to.be.instanceof(Buffer);
    expect(res).to.deep.equal(Buffer.from([0, 1]));
  });

  it('should readRegister', async () => {
    const client = new ModbusClient(modbusClientApi);
    modbusClientApi.readHoldingRegisters = stub().yields(null, {
      buffer: Buffer.from([0, 1]),
    });
    const res = await client.readRegister(1, 4);
    expect(res).to.be.instanceof(Buffer);
    expect(res).to.deep.equal(Buffer.from([0, 1]));
  });

  it('should readRegisterAsString', async () => {
    const client = new ModbusClient(modbusClientApi);
    modbusClientApi.readHoldingRegisters = stub().yields(null, {
      buffer: Buffer.from('1234'),
    });
    const res = await client.readRegisterAsString(1, 4);
    expect(res).to.eq('1234');
  });

  it('should getValueModel 1-phase', async () => {
    const client = new ModbusClient(modbusClientApi);
    client.models[MODEL.INVERTER_1_PHASE] = {};
    expect(client.getValueModel()).to.eq(101);
  });

  it('should getValueModel split-phase', async () => {
    const client = new ModbusClient(modbusClientApi);
    expect(client.getValueModel()).to.eq(102);
  });

  it('should getValueModel 3-phase', async () => {
    const client = new ModbusClient(modbusClientApi);
    client.models[MODEL.INVERTER_3_PHASE] = {};
    expect(client.getValueModel()).to.eq(103);
  });
});
