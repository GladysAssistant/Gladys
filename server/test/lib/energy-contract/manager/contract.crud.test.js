const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const db = require('../../../../models');
const { EVENTS, ENERGY_CONTRACT_STATUS } = require('../../../../utils/constants');
const { buildManager, contractPayload, BASE_TARIFF, TEMPO_TARIFF, METER_DEVICE_ID } = require('./helpers');
const { getStatus } = require('../../../../lib/energy-contract/contract.getStatus');
const { validateContract, isValidTimezone } = require('../../../../lib/energy-contract/contract.validate');

describe('energyContract: contracts CRUD', () => {
  let energyContract;
  let event;
  beforeEach(async () => {
    ({ energyContract, event } = await buildManager());
  });

  it('should create a contract with the system timezone, a selector and an active status', async () => {
    const emitted = sinon.fake();
    event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, emitted);
    const contract = await energyContract.create(contractPayload());
    expect(contract).to.include({
      name: 'EDF Base',
      selector: 'edf-base',
      timezone: 'Europe/Paris',
      currency: 'EUR',
      pricing_mode: 'rules',
      provider_kind: 'user',
      direction: 'consumption',
      valid_to: null,
      status: ENERGY_CONTRACT_STATUS.ACTIVE,
    });
    expect(contract.tariff.components[0].fallback).to.deep.equal({ price: 0.2 });
    expect(emitted.callCount).to.equal(1);
    expect(emitted.firstCall.args[0].electric_meter_device_ids).to.deep.equal([METER_DEVICE_ID]);
    // 2025-01-01 00:00 Paris = 2024-12-31 23:00 UTC
    expect(emitted.firstCall.args[0].from.toISOString()).to.equal('2024-12-31T23:00:00.000Z');
  });

  it('should default the timezone to UTC when the system has none', async () => {
    const { energyContract: manager, variables } = await buildManager();
    variables.TIMEZONE = null;
    const contract = await manager.create(contractPayload());
    expect(contract.timezone).to.equal('UTC');
  });

  it('should reject an invalid payload, an invalid tariff and an unknown meter', async () => {
    await expect(energyContract.create(contractPayload({ currency: 'euro' }))).to.be.rejectedWith(/currency/);
    await expect(energyContract.create({ name: 'x' })).to.be.rejectedWith('electric_meter_device_id: is required');
    await expect(
      energyContract.create(contractPayload({ tariff: { tariff_version: 1, components: [] } })),
    ).to.be.rejectedWith(/tariff\.components/);
    await expect(energyContract.create(contractPayload({ timezone: 'Mars/Olympus' }))).to.be.rejectedWith(
      /not a known IANA timezone/,
    );
    await expect(
      energyContract.create(contractPayload({ valid_from: '2025-02-01', valid_to: '2025-01-01' })),
    ).to.be.rejectedWith('valid_to: must be on or after valid_from');
    await expect(
      energyContract.create(contractPayload({ electric_meter_device_id: 'd1fe2ab9-8c50-4053-ac40-83421f899c00' })),
    ).to.be.rejectedWith('ELECTRIC_METER_DEVICE_NOT_FOUND');
    expect(isValidTimezone('Asia/Kathmandu')).to.equal(true);
  });

  it('should reject a delegated contract carrying non-fixed components, accept fixed only', async () => {
    await expect(
      energyContract.create(contractPayload({ pricing_mode: 'delegated', provider_service_id: null })),
    ).to.be.rejectedWith(/only carries fixed components \(found "consumption"\)/);
    const contract = await energyContract.create(
      contractPayload({
        pricing_mode: 'delegated',
        tariff: { tariff_version: 1, components: [{ key: 'subscription', kind: 'fixed', amount: 12, per: 'month' }] },
      }),
    );
    expect(contract.pricing_mode).to.equal('delegated');
    // no provider: a delegated contract is orphaned
    expect(contract.status).to.equal(ENERGY_CONTRACT_STATUS.ORPHANED);
  });

  it('should refuse a date overlap on the same meter and direction', async () => {
    await energyContract.create(contractPayload({ valid_from: '2025-01-01', valid_to: '2025-06-30' }));
    await expect(
      energyContract.create(contractPayload({ name: 'Other', valid_from: '2025-06-30' })),
    ).to.be.rejectedWith(/already covers this meter from 2025-01-01 to 2025-06-30/);
    await expect(
      energyContract.create(contractPayload({ name: 'Other', valid_from: '2024-01-01', valid_to: '2025-01-01' })),
    ).to.be.rejectedWith(/already covers this meter/);
    // the day after the end is fine, and so is a production contract on the same dates
    const next = await energyContract.create(contractPayload({ name: 'Next', valid_from: '2025-07-01' }));
    expect(next.selector).to.equal('next');
    const production = await energyContract.create(
      contractPayload({ name: 'Solar', direction: 'production', valid_from: '2025-01-01' }),
    );
    expect(production.direction).to.equal('production');
    await expect(
      energyContract.create(contractPayload({ name: 'Third', valid_from: '2020-01-01' })),
    ).to.be.rejectedWith(/already covers this meter from 2025-01-01 to 2025-06-30/);
  });

  it('should list, filter and read contracts with their status and provider', async () => {
    await energyContract.create(contractPayload({ valid_from: '2020-01-01', valid_to: '2020-12-31' }));
    await energyContract.create(contractPayload({ name: 'Current', valid_from: '2021-01-01', valid_to: '2098-12-31' }));
    await energyContract.create(contractPayload({ name: 'Future', valid_from: '2099-01-01' }));
    await expect(
      energyContract.create(contractPayload({ name: 'Current bis', valid_from: '2021-01-01' })),
    ).to.be.rejectedWith(/already covers/);
    const contracts = await energyContract.get({ electric_meter_device_id: METER_DEVICE_ID });
    expect(contracts.map((c) => [c.name, c.status])).to.deep.equal([
      ['Future', ENERGY_CONTRACT_STATUS.SCHEDULED],
      ['Current', ENERGY_CONTRACT_STATUS.ACTIVE],
      ['EDF Base', ENERGY_CONTRACT_STATUS.EXPIRED],
    ]);
    const bySelector = await energyContract.getBySelector('current');
    expect(bySelector.name).to.equal('Current');
    expect(bySelector.provider_service).to.equal(null);
    await expect(energyContract.getBySelector('nope')).to.be.rejectedWith('ENERGY_CONTRACT_NOT_FOUND');
    const active = await energyContract.getActive(METER_DEVICE_ID, '2020-06-01');
    expect(active.name).to.equal('EDF Base');
    expect(await energyContract.getActive(METER_DEVICE_ID, '2020-12-31')).to.have.property('name', 'EDF Base');
    expect(await energyContract.getActive(METER_DEVICE_ID, '2021-01-01')).to.have.property('name', 'Current');
    expect(await energyContract.getActive(METER_DEVICE_ID, '2019-01-01')).to.equal(null);
    const empty = await energyContract.get({ electric_meter_device_id: 'd1fe2ab9-8c50-4053-ac40-83421f899c00' });
    expect(empty).to.deep.equal([]);
  });

  it('should expose the provider service summary of an integration contract', async () => {
    const service = await db.Service.create({
      name: 'ext-dev-octopus',
      selector: 'ext-dev-octopus',
      version: '1.0.0',
      status: 'RUNNING',
      type: 'external',
      manifest: { name: 'Octopus' },
    });
    const contract = await energyContract.create(
      contractPayload({ provider_kind: 'integration', provider_service_id: service.id, template_key: 'agile' }),
    );
    expect(contract.provider_service).to.deep.equal({
      id: service.id,
      name: 'ext-dev-octopus',
      selector: 'ext-dev-octopus',
      status: 'RUNNING',
    });
    const [listed] = await energyContract.get({ provider_service_id: service.id });
    expect(listed.template_key).to.equal('agile');
  });

  it('should update a contract and only request a recalculation when the costs change', async () => {
    const created = await energyContract.create(contractPayload());
    const emitted = sinon.fake();
    event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, emitted);
    const renamed = await energyContract.update('edf-base', { name: 'Renamed' });
    expect(renamed.name).to.equal('Renamed');
    expect(renamed.selector).to.equal('edf-base');
    expect(emitted.callCount).to.equal(0);
    const changed = await energyContract.update('edf-base', {
      tariff: {
        ...BASE_TARIFF,
        components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.3 } }],
      },
      valid_from: '2025-03-01',
    });
    expect(changed.tariff.components[0].fallback.price).to.equal(0.3);
    expect(emitted.callCount).to.equal(1);
    // recomputed from the earliest valid_from (the old one)
    expect(emitted.firstCall.args[0].from.toISOString()).to.equal('2024-12-31T23:00:00.000Z');
    const later = await energyContract.update('edf-base', { valid_from: '2025-06-01', valid_to: '' });
    expect(later.valid_to).to.equal(null);
    expect(emitted.secondCall.args[0].from.toISOString()).to.equal('2025-02-28T23:00:00.000Z');
    expect(created.id).to.equal(later.id);
    await expect(energyContract.update('nope', { name: 'x' })).to.be.rejectedWith('ENERGY_CONTRACT_NOT_FOUND');
    await expect(energyContract.update('edf-base', { currency: 'nope' })).to.be.rejectedWith(/currency/);
  });

  it('should refuse an update creating an overlap', async () => {
    await energyContract.create(contractPayload({ valid_from: '2025-01-01', valid_to: '2025-06-30' }));
    await energyContract.create(contractPayload({ name: 'Next', valid_from: '2025-07-01' }));
    await expect(energyContract.update('edf-base', { valid_to: '2025-07-01' })).to.be.rejectedWith(/Next/);
  });

  it('should delete a contract and request a recalculation', async () => {
    await energyContract.create(contractPayload());
    const emitted = sinon.fake();
    event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, emitted);
    await energyContract.destroy('edf-base');
    expect(emitted.callCount).to.equal(1);
    expect(await energyContract.get()).to.deep.equal([]);
    await expect(energyContract.destroy('edf-base')).to.be.rejectedWith('ENERGY_CONTRACT_NOT_FOUND');
  });

  it('should compute the status in the contract timezone', () => {
    const base = { timezone: 'Pacific/Kiritimati', valid_from: '2026-01-13', valid_to: null, pricing_mode: 'rules' };
    // 2026-01-12 23:00 UTC is already the 13th in Kiritimati (+14)
    expect(getStatus(base, Date.UTC(2026, 0, 12, 23))).to.equal(ENERGY_CONTRACT_STATUS.ACTIVE);
    expect(getStatus({ ...base, timezone: 'UTC' }, Date.UTC(2026, 0, 12, 23))).to.equal(
      ENERGY_CONTRACT_STATUS.SCHEDULED,
    );
    expect(getStatus({ ...base, valid_to: '2026-01-13' }, Date.UTC(2026, 0, 14, 12))).to.equal(
      ENERGY_CONTRACT_STATUS.EXPIRED,
    );
    expect(getStatus({ ...base, pricing_mode: 'delegated', provider_service_id: null })).to.equal(
      ENERGY_CONTRACT_STATUS.ORPHANED,
    );
  });

  it('should validate partial payloads and the tariff of a tempo contract', () => {
    expect(validateContract({ name: 'x' }, { partial: true })).to.deep.equal({ name: 'x' });
    expect(() => validateContract({ inputs: { 'Bad Key': 1 } }, { partial: true })).to.throw(/inputs/);
    expect(validateContract({ tariff: TEMPO_TARIFF, inputs: { a: 1 } }, { partial: true }).inputs).to.deep.equal({
      a: 1,
    });
  });

  it('should keep the inputs and substitute them in the tariff on create', async () => {
    const contract = await energyContract.create(
      contractPayload({
        tariff: {
          tariff_version: 1,
          components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: '{{input:price}}' } }],
        },
        inputs: { price: 0.25 },
      }),
    );
    expect(contract.tariff.components[0].fallback.price).to.equal(0.25);
    expect(contract.inputs).to.deep.equal({ price: 0.25 });
  });
});
