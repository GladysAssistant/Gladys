const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { buildManager, contractPayload, TEMPO_TARIFF, TEST_SERVICE_ID } = require('./helpers');
const { EVENTS } = require('../../../../utils/constants');

describe('energyContract.checkPriceChanges', () => {
  let energyContract;
  let event;
  let clock;
  beforeEach(async () => {
    ({ energyContract, event } = await buildManager({ timezone: 'UTC' }));
    clock = sinon.useFakeTimers({ now: new Date('2026-01-12T12:40:00Z'), toFake: ['Date'] });
  });
  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should only record the first observation, then emit a trigger check when the price changes', async () => {
    await energyContract.declareCalendar({ key: 'tempo', granularity: 'day' }, TEST_SERVICE_ID);
    await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-12', value: 'blue' }], TEST_SERVICE_ID);
    const contract = await energyContract.create(
      contractPayload({ name: 'Tempo', tariff: TEMPO_TARIFF, timezone: 'UTC', valid_from: '2026-01-01' }),
    );
    const emit = sinon.spy(event, 'emit');
    // first observation: recorded, nothing emitted
    const first = await energyContract.checkPriceChanges();
    expect(first).to.deep.equal([]);
    expect(energyContract.lastKnownPrices.get(contract.id)).to.deep.equal({ price: 0.1609, label: 'Blue peak' });
    expect(emit.callCount).to.equal(0);
    // same price: nothing emitted
    const same = await energyContract.checkPriceChanges();
    expect(same).to.deep.equal([]);
    expect(emit.callCount).to.equal(0);
    // 22:00 UTC: blue off-peak
    clock.setSystemTime(new Date('2026-01-12T22:10:00Z'));
    const changed = await energyContract.checkPriceChanges();
    expect(changed).to.deep.equal([
      {
        type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
        contract: 'tempo',
        price: 0.1296,
        previous_price: 0.1609,
        label: 'Blue off-peak',
        previous_label: 'Blue peak',
        currency: 'EUR',
      },
    ]);
    expect(emit.callCount).to.equal(1);
    expect(emit.firstCall.args[0]).to.equal(EVENTS.TRIGGERS.CHECK);
    expect(emit.firstCall.args[1]).to.deep.equal(changed[0]);
    expect(energyContract.lastKnownPrices.get(contract.id)).to.deep.equal({ price: 0.1296, label: 'Blue off-peak' });
  });

  it('should emit when only the label changes and normalise missing values to null', async () => {
    const contract = await energyContract.create(contractPayload({ timezone: 'UTC', valid_from: '2026-01-01' }));
    const getCurrent = sinon.stub(energyContract, 'getCurrent');
    getCurrent.onCall(0).resolves({ price: 0.2, currency: 'EUR' });
    getCurrent.onCall(1).resolves({ price: 0.2, label: 'peak', currency: 'EUR' });
    getCurrent.onCall(2).resolves({ label: 'peak', currency: 'EUR' });
    await energyContract.checkPriceChanges();
    expect(energyContract.lastKnownPrices.get(contract.id)).to.deep.equal({ price: 0.2, label: null });
    const labelChanged = await energyContract.checkPriceChanges();
    expect(labelChanged).to.have.lengthOf(1);
    expect(labelChanged[0]).to.include({ price: 0.2, previous_price: 0.2, label: 'peak', previous_label: null });
    const priceUnknown = await energyContract.checkPriceChanges();
    expect(priceUnknown).to.have.lengthOf(1);
    expect(priceUnknown[0]).to.include({ price: null, previous_price: 0.2, label: 'peak', previous_label: 'peak' });
  });

  it('should skip the contracts that are not active', async () => {
    await energyContract.create(contractPayload({ name: 'Expired', valid_from: '2020-01-01', valid_to: '2020-12-31' }));
    await energyContract.create(contractPayload({ name: 'Scheduled', valid_from: '2030-01-01' }));
    const getCurrent = sinon.spy(energyContract, 'getCurrent');
    const emitted = await energyContract.checkPriceChanges();
    expect(emitted).to.deep.equal([]);
    expect(getCurrent.callCount).to.equal(0);
    expect(energyContract.lastKnownPrices.size).to.equal(0);
  });

  it('should log and continue when one contract fails', async () => {
    // two active contracts (a meter carries only one at a time: listed through a stub)
    const fine = { id: 'fine-id', selector: 'fine', status: 'active' };
    sinon.stub(energyContract, 'get').resolves([{ id: 'broken-id', selector: 'broken', status: 'active' }, fine]);
    const getCurrent = sinon.stub(energyContract, 'getCurrent');
    getCurrent.withArgs('broken').rejects(new Error('boom'));
    getCurrent
      .withArgs('fine')
      .onFirstCall()
      .resolves({ price: 0.1, label: 'a', currency: 'EUR' });
    getCurrent
      .withArgs('fine')
      .onSecondCall()
      .resolves({ price: 0.3, label: 'a', currency: 'EUR' });
    await energyContract.checkPriceChanges();
    const emitted = await energyContract.checkPriceChanges();
    expect(emitted).to.have.lengthOf(1);
    expect(emitted[0]).to.include({ contract: 'fine', price: 0.3, previous_price: 0.1 });
    expect(energyContract.lastKnownPrices.has(fine.id)).to.equal(true);
    expect(energyContract.lastKnownPrices.size).to.equal(1);
  });
});
