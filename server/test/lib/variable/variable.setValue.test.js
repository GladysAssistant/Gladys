const { expect } = require('chai');
const chaiAssert = require('chai').assert;
const { fake, assert } = require('sinon');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const Variable = require('../../../lib/variable');

describe('variable.setValue', () => {
  const variable = new Variable();
  it('should return a new variable created', async () => {
    const result = await variable.setValue('TELEGRAM_API_KEY', 'XXXX', 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(result).to.have.property('name', 'TELEGRAM_API_KEY');
    expect(result).to.have.property('value', 'XXXX');
  });
  it('should update an existing variable', async () => {
    const result = await variable.setValue('SECURE_VARIABLE', 'NEW_VALUE', 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(result).to.have.property('name', 'SECURE_VARIABLE');
    expect(result).to.have.property('value', 'NEW_VALUE');
  });
  it('should return a new user variable created', async () => {
    const result = await variable.setValue(
      'CALENDAR_USERNAME',
      'xxxx@yyyy.com',
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    );
    expect(result).to.have.property('name', 'CALENDAR_USERNAME');
    expect(result).to.have.property('value', 'xxxx@yyyy.com');
  });
  it('should update an existing user variable', async () => {
    const result = await variable.setValue(
      'USER_SECURE_VARIABLE',
      'NEW_USER_VALUE',
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    );
    expect(result).to.have.property('name', 'USER_SECURE_VARIABLE');
    expect(result).to.have.property('value', 'NEW_USER_VALUE');
  });
  it('should create global variable', async () => {
    const result = await variable.setValue('SECURE_VARIABLE', 'NEW_VALUE');
    expect(result).to.have.property('name', 'SECURE_VARIABLE');
    expect(result).to.have.property('value', 'NEW_VALUE');
  });
  it('should not allow lowercase variable', async () => {
    const promise = variable.setValue('lowercasevariable', 'NEW_VALUE', 'a810b8db-6d04-4697-bed3-c4b72c996279');
    return chaiAssert.isRejected(promise, 'Validation error: Validation isUppercase on name failed');
  });
  it('should not allow null varialbe', async () => {
    const promise = variable.setValue(null, 'NEW_VALUE', 'a810b8db-6d04-4697-bed3-c4b72c996279');
    return chaiAssert.isRejected(promise, 'notNull Violation: t_variable.name cannot be null');
  });
  it('should not allow variable with null content inside', async () => {
    const promise = variable.setValue('SECURE_VARIABLE', null, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    return chaiAssert.isRejected(promise, 'notNull Violation: t_variable.value cannot be null');
  });
  it('should create timezone variable and emit event', async () => {
    const event = {
      emit: fake.returns(),
    };
    const customVariable = new Variable(event);
    await customVariable.setValue(SYSTEM_VARIABLE_NAMES.TIMEZONE, 'TIMEZONE');
    assert.calledWith(event.emit, EVENTS.SYSTEM.TIMEZONE_CHANGED);
  });
  it('should create gateway users keys variable and emit event', async () => {
    const event = {
      emit: fake.returns(),
    };
    const customVariable = new Variable(event);
    await customVariable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_USERS_KEYS, 'TIMEZONE');
    assert.calledWith(event.emit, EVENTS.GATEWAY.USER_KEYS_CHANGED);
  });
});
