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

  it('should execute the scene when the price of the selected contract changes', async () => {
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
          energy_contract: 'edf-tempo',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
      contract: 'edf-tempo',
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

  it('should match any contract when the trigger has no contract selector, and only the selected one otherwise', () => {
    const match = triggersFunc[EVENTS.ENERGY_CONTRACT.PRICE_CHANGED];
    const priceEvent = { type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED, contract: 'edf-tempo', price: 0.2 };
    expect(match(sceneManager, 'scene', priceEvent, { type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED })).to.equal(true);
    expect(
      match(sceneManager, 'scene', priceEvent, { type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED, energy_contract: '' }),
    ).to.equal(true);
    expect(
      match(sceneManager, 'scene', priceEvent, {
        type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
        energy_contract: 'edf-tempo',
      }),
    ).to.equal(true);
    expect(
      match(sceneManager, 'scene', priceEvent, {
        type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
        energy_contract: 'other-contract',
      }),
    ).to.equal(false);
  });
});
