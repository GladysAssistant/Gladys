const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const { assert, expect } = require('chai');
const EventEmitter = require('events');

const { AbortScene } = require('../../../../utils/coreErrors');
const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const event = new EventEmitter();

describe('scene.energyCurrentPriceCondition', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  const run = (energyContract, action) =>
    executeActions({ event, energyContract }, [[{ type: ACTIONS.ENERGY_CONTRACT.CURRENT_PRICE, ...action }]], {});

  afterEach(() => {
    sinon.restore();
  });

  it('should continue the scene when the current price validates the condition', async () => {
    const energyContract = {
      getCurrent: fake.resolves({ price: 0.15, currency: 'EUR', label: 'off-peak' }),
    };
    await run(energyContract, { energy_contract: 'edf-tempo', operator: '<', value: 0.2 });
    await run(energyContract, { energy_contract: 'edf-tempo', operator: '<=', value: '0.15' });
    await run(energyContract, { energy_contract: 'edf-tempo', operator: '>=', value: 0.15 });
    await run(energyContract, { energy_contract: 'edf-tempo', operator: '>', value: 0.1 });
    await run(energyContract, { energy_contract: 'edf-tempo', operator: '=', value: 0.15 });
    await run(energyContract, { energy_contract: 'edf-tempo', operator: '!=', value: 0.2 });
    expect(energyContract.getCurrent.callCount).to.equal(6);
    expect(energyContract.getCurrent.firstCall.args).to.deep.equal(['edf-tempo']);
  });

  it('should abort the scene when the current price does not validate the condition', async () => {
    const energyContract = {
      getCurrent: fake.resolves({ price: 0.25, currency: 'EUR', label: 'peak' }),
    };
    const promise = run(energyContract, { energy_contract: 'edf-tempo', operator: '<', value: 0.2 });
    await assert.isRejected(promise, AbortScene, 'ENERGY_PRICE_CONDITION_NOT_MET');
  });

  it('should abort the scene when the current price is unknown', async () => {
    const energyContract = {
      getCurrent: fake.resolves({ price: null, currency: 'EUR', label: null }),
    };
    const promise = run(energyContract, { energy_contract: 'edf-tempo', operator: '<', value: 1 });
    await assert.isRejected(promise, AbortScene, 'ENERGY_PRICE_CONDITION_NOT_MET');
  });

  it('should abort the scene when the threshold is not a number', async () => {
    const energyContract = {
      getCurrent: fake.resolves({ price: 0.15, currency: 'EUR' }),
    };
    const promise = run(energyContract, { energy_contract: 'edf-tempo', operator: '<', value: 'abc' });
    await assert.isRejected(promise, AbortScene, 'CONDITION_VALUE_NOT_A_NUMBER');
  });

  it('should abort the scene when the contract does not exist', async () => {
    const energyContract = {
      getCurrent: fake.rejects(new Error('ENERGY_CONTRACT_NOT_FOUND')),
    };
    const promise = run(energyContract, { energy_contract: 'unknown', operator: '<', value: 1 });
    await assert.isRejected(promise, AbortScene, 'ENERGY_CONTRACT_NOT_FOUND');
  });
});
