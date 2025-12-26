const { expect, assert } = require('chai');
const db = require('../../../models');
const EnergyPrice = require('../../../lib/energy-price');

describe('energy-price', () => {
  const energyPrice = new EnergyPrice();

  it('should create an energy price and generate selector', async () => {
    const created = await energyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-01-01',
      price: 20,
    });
    expect(created).to.have.property('id');
    expect(created).to.have.property('selector');
    expect(created.selector).to.satisfies((selector) => selector.startsWith('base-consumption-euro-2025-01-01-any-'));
    expect(created).to.have.property('price', 20);
    expect(created).to.have.property('currency', 'euro');
  });

  it('should get energy prices (all and filtered) ordered by start_date', async () => {
    // create multiple entries
    await energyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-01-01',
      electric_meter_device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      price: 20,
    });
    await energyPrice.create({
      contract: 'base',
      price_type: 'subscription',
      currency: 'euro',
      start_date: '2025-02-01',
      price: 10,
    });
    await energyPrice.create({
      contract: 'edf_tempo',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2025-03-01',
      price: 30,
    });

    const all = await energyPrice.get();
    expect(all).to.be.instanceOf(Array);
    expect(all.length).to.be.greaterThan(0);

    // ordered by start_date DESC
    for (let i = 1; i < all.length; i += 1) {
      expect(all[i].start_date <= all[i - 1].start_date).to.equal(true);
    }

    const filteredByElectricMeterDeviceId = await energyPrice.get({
      electric_meter_device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
    });
    expect(filteredByElectricMeterDeviceId).to.have.lengthOf(1);
    expect(filteredByElectricMeterDeviceId[0]).to.have.property(
      'electric_meter_device_id',
      '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
    );
  });

  it('should update an energy price by selector', async () => {
    const row = await energyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2026-01-01',
      price: 20,
    });
    const updated = await energyPrice.update(row.selector, { price: 21 });
    expect(updated).to.have.property('price', 21);
  });

  it('should throw when updating unknown selector', async () => {
    const promise = energyPrice.update('unknown-selector', { price: 42 });
    return assert.isRejected(promise);
  });

  it('should destroy an energy price by selector', async () => {
    const row = await energyPrice.create({
      contract: 'base',
      price_type: 'consumption',
      currency: 'euro',
      start_date: '2027-01-01',
      price: 20,
    });
    await energyPrice.destroy(row.selector);
    const found = await db.EnergyPrice.findOne({ where: { selector: row.selector } });
    expect(found).to.equal(null);
  });
});
