const { expect } = require('chai');

const { IsJsonString } = require('../../../../services/arduino/lib/isJsonString');

describe('IsJsonString function', async () => {
  it('should return true', async () => {
    const message = '{ "function_name": "emit_433_chacon", "parameters": { "data_pin": "4", "code": "1536116352" } }';
    const res = IsJsonString(message);
    expect(res).to.equal(true);
  });
  it('should return false', async () => {
    const message = '{ "function_name": "emit_433_chacon", "parameters": { "data_pin": "4", "code": "1536116352"';
    const res = IsJsonString(message);
    expect(res).to.equal(false);
  });
});
