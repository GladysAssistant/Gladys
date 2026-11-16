const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { triggersFunc } = require('../../../../lib/scene/scene.triggers');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

describe('Scene.triggers.energyPriceChanged', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const service = {
    getService: fake.returns(null),
  };

  beforeEach(() => {
    const house = {
      get: fake.resolves([]),
    };

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    const stateManager = new StateManager();

    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should execute the scene when the price of the selected meter changes', async () => {
    await sceneManager.addScene({
      selector: 'energy-price-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
          electric_meter: 'linky',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
      electric_meter: 'linky',
      contract: 'edf-tempo',
      meter_contracts: ['edf-tempo'],
      price: 0.7562,
      previous_price: 0.1568,
      label: 'Red peak',
      previous_label: 'Red off-peak',
      currency: 'EUR',
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledOnce(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should match any meter when the trigger has no meter, and only the selected meter otherwise', () => {
    const match = triggersFunc[EVENTS.ENERGY_CONTRACT.PRICE_CHANGED];
    const type = EVENTS.ENERGY_CONTRACT.PRICE_CHANGED;
    const priceEvent = {
      type,
      electric_meter: 'linky',
      contract: 'edf-tempo-2026',
      meter_contracts: ['edf-tempo-2026', 'edf-tempo-2025'],
      price: 0.2,
    };
    expect(match(sceneManager, 'scene', priceEvent, { type })).to.equal(true);
    expect(match(sceneManager, 'scene', priceEvent, { type, electric_meter: '' })).to.equal(true);
    expect(match(sceneManager, 'scene', priceEvent, { type, electric_meter: 'linky' })).to.equal(true);
    expect(match(sceneManager, 'scene', priceEvent, { type, electric_meter: 'solar-meter' })).to.equal(false);
    // the meter wins over a contract selector left by an older save
    expect(
      match(sceneManager, 'scene', priceEvent, { type, electric_meter: 'linky', energy_contract: 'other-contract' }),
    ).to.equal(true);
  });

  it('should read the contract selector of a trigger saved before the meter targeting as the meter of that contract', () => {
    const match = triggersFunc[EVENTS.ENERGY_CONTRACT.PRICE_CHANGED];
    const type = EVENTS.ENERGY_CONTRACT.PRICE_CHANGED;
    // the trigger names the expired contract; its successor on the same meter is active
    const priceEvent = {
      type,
      electric_meter: 'linky',
      contract: 'edf-tempo-2026',
      meter_contracts: ['edf-tempo-2026', 'edf-tempo-2025'],
      price: 0.2,
    };
    expect(match(sceneManager, 'scene', priceEvent, { type, energy_contract: '' })).to.equal(true);
    expect(match(sceneManager, 'scene', priceEvent, { type, energy_contract: 'edf-tempo-2025' })).to.equal(true);
    expect(match(sceneManager, 'scene', priceEvent, { type, energy_contract: 'edf-tempo-2026' })).to.equal(true);
    expect(match(sceneManager, 'scene', priceEvent, { type, energy_contract: 'other-meter-contract' })).to.equal(false);
  });
});
