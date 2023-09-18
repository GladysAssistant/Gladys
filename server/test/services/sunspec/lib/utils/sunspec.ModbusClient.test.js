const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert, stub } = sinon;

const { ModbusClient } = require('../../../../../services/sunspec/lib/utils/sunspec.ModbusClient');

describe('SunSpec ModbusClient', () => {
  let modbusClientApi;

  beforeEach(() => {
    modbusClientApi = {
      connectTCP: fake.returns(true),
      readHoldingRegisters: fake.returns(true),
    };
  });

  afterEach(() => {
    sinon.reset();
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
});
