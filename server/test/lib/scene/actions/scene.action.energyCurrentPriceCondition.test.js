const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const { assert, expect } = require('chai');
const EventEmitter = require('events');

const { AbortScene } = require('../../../../utils/coreErrors');
const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const event = new EventEmitter();

const CONTRACT = { id: 'contract-id', selector: 'edf-tempo', name: 'EDF Tempo' };

describe('scene.energyCurrentPriceCondition', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  const run = (energyContract, action) =>
    executeActions({ event, energyContract }, [[{ type: ACTIONS.ENERGY_CONTRACT.CURRENT_PRICE, ...action }]], {});

  afterEach(() => {
    sinon.restore();
  });

  it('should continue the scene when the current price validates the condition', async () => {
    const energyContract = {
      getMeterCurrent: fake.resolves({ price: 0.15, currency: 'EUR', label: 'off-peak', contract: CONTRACT }),
    };
    await run(energyContract, { electric_meter: 'linky', operator: '<', value: 0.2 });
    await run(energyContract, { electric_meter: 'linky', operator: '<=', value: '0.15' });
    await run(energyContract, { electric_meter: 'linky', operator: '>=', value: 0.15 });
    await run(energyContract, { electric_meter: 'linky', operator: '>', value: 0.1 });
    await run(energyContract, { electric_meter: 'linky', operator: '=', value: 0.15 });
    await run(energyContract, { electric_meter: 'linky', operator: '!=', value: 0.2 });
    expect(energyContract.getMeterCurrent.callCount).to.equal(6);
    expect(energyContract.getMeterCurrent.firstCall.args).to.deep.equal([
      { electric_meter: 'linky', energy_contract: undefined },
    ]);
  });

  it('should price the main meter without a meter, and the meter of the contract a former save names', async () => {
    const energyContract = {
      getMeterCurrent: fake.resolves({ price: 0.15, currency: 'EUR', label: 'off-peak', contract: CONTRACT }),
    };
    await run(energyContract, { operator: '<', value: 0.2 });
    await run(energyContract, { energy_contract: 'edf-tempo-2025', operator: '<', value: 0.2 });
    expect(energyContract.getMeterCurrent.args).to.deep.equal([
      [{ electric_meter: undefined, energy_contract: undefined }],
      [{ electric_meter: undefined, energy_contract: 'edf-tempo-2025' }],
    ]);
  });

  it('should abort the scene when the meter has no active contract', async () => {
    const energyContract = {
      getMeterCurrent: fake.resolves({ electric_meter: { selector: 'linky' }, contract: null, price: null }),
    };
    const promise = run(energyContract, { electric_meter: 'linky', operator: '<', value: 1 });
    await assert.isRejected(promise, AbortScene, 'NO_ACTIVE_ENERGY_CONTRACT');
  });

  it('should abort the scene when the current price does not validate the condition', async () => {
    const energyContract = {
      getMeterCurrent: fake.resolves({ price: 0.25, currency: 'EUR', label: 'peak', contract: CONTRACT }),
    };
    const promise = run(energyContract, { electric_meter: 'linky', operator: '<', value: 0.2 });
    await assert.isRejected(promise, AbortScene, 'ENERGY_PRICE_CONDITION_NOT_MET');
  });

  it('should abort the scene when the current price is unknown', async () => {
    const energyContract = {
      getMeterCurrent: fake.resolves({ price: null, currency: 'EUR', label: null, contract: CONTRACT }),
    };
    const promise = run(energyContract, { electric_meter: 'linky', operator: '<', value: 1 });
    await assert.isRejected(promise, AbortScene, 'ENERGY_PRICE_CONDITION_NOT_MET');
  });

  it('should abort the scene when the threshold is not a number', async () => {
    const energyContract = {
      getMeterCurrent: fake.resolves({ price: 0.15, currency: 'EUR', contract: CONTRACT }),
    };
    const promise = run(energyContract, { electric_meter: 'linky', operator: '<', value: 'abc' });
    await assert.isRejected(promise, AbortScene, 'CONDITION_VALUE_NOT_A_NUMBER');
  });

  it('should abort the scene when the meter or the contract does not exist', async () => {
    const energyContract = {
      getMeterCurrent: fake.rejects(new Error('ENERGY_CONTRACT_NOT_FOUND')),
    };
    const promise = run(energyContract, { energy_contract: 'unknown', operator: '<', value: 1 });
    await assert.isRejected(promise, AbortScene, 'ENERGY_CONTRACT_NOT_FOUND');
  });
});
