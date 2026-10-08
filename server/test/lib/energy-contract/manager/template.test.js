const { expect } = require('chai');
const nock = require('nock');
const db = require('../../../../models');
const EnergyMonitoring = require('../../../../services/energy-monitoring/lib');
const { buildManager } = require('./helpers');
const { convertCatalogueV1, CATALOGUE_CACHE_TTL_MS } = require('../../../../lib/energy-contract/template.catalogue');
const { EDF_TEMPO_TEMPLATE, TEMPO_CALENDAR } = require('../../../../lib/energy-contract/templates/internal');
const { validateTariff } = require('../../../../lib/energy-contract/tariff.validate');
const { substituteInputs } = require('../../../../lib/energy-contract/tariff.compile');

const RELEASE = (assets) => ({ tag_name: 'v2.0.0', assets });
const V1_URL = 'https://github.com/GladysAssistant/energy-contracts/releases/download/v2.0.0/contracts.json';
const V2_URL = 'https://github.com/GladysAssistant/energy-contracts/releases/download/v2.0.0/contracts-v2.json';

const V1_CATALOGUE = {
  'edf-base': {
    '6': [
      {
        contract: 'base',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        end_date: null,
        price: 2516,
      },
      {
        contract: 'base',
        price_type: 'subscription',
        currency: 'euro',
        start_date: '2024-02-01',
        end_date: null,
        price: 128000,
      },
      {
        contract: 'base',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2023-02-01',
        end_date: '2024-01-31',
        price: 2276,
      },
      {
        contract: 'base',
        price_type: 'subscription',
        currency: 'euro',
        start_date: '2023-02-01',
        end_date: '2024-01-31',
        price: 120000,
      },
    ],
    '9': [
      {
        contract: 'base',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        end_date: null,
        price: 2516,
      },
    ],
  },
  'edf-peak-off-peak': {
    '6': [
      {
        contract: 'peak-off-peak',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        price: 2700,
        hour_slots: 'TO_REPLACE_PEAK',
      },
      {
        contract: 'peak-off-peak',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        price: 2068,
        hour_slots: 'TO_REPLACE_OFF_PEAK',
      },
    ],
  },
  'edf-tempo': {
    '6': [
      {
        contract: 'edf_tempo',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        price: 1296,
        day_type: 'blue',
        hour_slots: '22:00,22:30,23:00,23:30,00:00,00:30,01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30',
      },
      {
        contract: 'edf_tempo',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        price: 1609,
        day_type: 'blue',
        hour_slots:
          '06:00,06:30,07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30',
      },
      {
        contract: 'edf_tempo',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        price: 7562,
        day_type: 'red',
        hour_slots: '06:00,06:30,07:00,07:30',
      },
      {
        contract: 'edf_tempo',
        price_type: 'consumption',
        currency: 'euro',
        start_date: '2024-02-01',
        price: 1568,
        day_type: 'red',
        hour_slots: '22:00,22:30,23:00',
      },
    ],
  },
  broken: null,
  empty: { '6': [] },
};

const V2_CATALOGUE = {
  templates: [
    {
      key: 'octopus-agile',
      name: { en: 'Octopus Agile' },
      country: 'GB',
      currency: 'GBP',
      timezone: 'Europe/London',
      pricing_mode: 'rules',
      version: '2026-01-01',
      inputs: [],
      tariff: {
        tariff_version: 1,
        components: [{ key: 'e', kind: 'consumption', rules: [], fallback: { price: 0.25 } }],
      },
    },
  ],
  calendars: [{ key: 'holidays-gb', granularity: 'day', values: ['holiday'] }],
};

describe('energyContract: templates and catalogue', () => {
  let energyContract;
  let stateManager;
  beforeEach(async () => {
    nock.cleanAll();
    ({ energyContract, stateManager } = await buildManager());
  });
  afterEach(() => nock.cleanAll());

  it('should prefer contracts-v2.json and cache the catalogue', async () => {
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(
        200,
        RELEASE([
          { name: 'contracts.json', browser_download_url: V1_URL },
          { name: 'contracts-v2.json', browser_download_url: V2_URL },
        ]),
      );
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v2.0.0/contracts-v2.json')
      .reply(200, V2_CATALOGUE);
    const catalogue = await energyContract.getCatalogue();
    expect(catalogue).to.deep.include({ version: 'v2.0.0', format: 2 });
    expect(catalogue.templates[0].key).to.equal('octopus-agile');
    expect(catalogue.calendars[0].key).to.equal('holidays-gb');
    // cached: no second request
    const again = await energyContract.getCatalogue();
    expect(again).to.equal(catalogue);
    expect(energyContract.catalogueCache.expires_at).to.be.above(Date.now() + CATALOGUE_CACHE_TTL_MS - 5000);
    const templates = await energyContract.getCommunityTemplates();
    expect(templates[0].provider).to.deep.equal({ kind: 'community', name: 'energy-contracts', version: 'v2.0.0' });
    // the service endpoint serves the v2 shape
    const handler = new EnergyMonitoring({ energyContract, job: { wrapper: (t, f) => f } }, 'id');
    expect(await handler.getContracts()).to.deep.equal({
      templates: V2_CATALOGUE.templates,
      calendars: V2_CATALOGUE.calendars,
      version: 'v2.0.0',
    });
  });

  it('should convert contracts.json (v1) when it is the only asset', async () => {
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, RELEASE([{ name: 'contracts.json', browser_download_url: V1_URL }]));
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v2.0.0/contracts.json')
      .reply(200, V1_CATALOGUE);
    const catalogue = await energyContract.getCatalogue();
    expect(catalogue.format).to.equal(1);
    expect(catalogue.raw).to.deep.equal(V1_CATALOGUE);
    const keys = catalogue.templates.map((t) => `${t.key}:${t.variant}`);
    expect(keys).to.deep.equal(['edf-base:6', 'edf-base:9', 'edf-peak-off-peak:6', 'edf-tempo:6']);
    // every converted template is a valid tariff
    catalogue.templates.forEach((template) => {
      const inputs = {};
      template.inputs.forEach((input) => {
        inputs[input.key] = input.key === 'off_peak_slots' ? [['22:00', '06:00']] : input.default;
      });
      validateTariff(substituteInputs(template.tariff, inputs));
    });
    const base6 = catalogue.templates[0];
    expect(base6).to.include({ contract_type: 'base', subscribed_power: 6, currency: 'EUR', timezone: 'Europe/Paris' });
    // current prices without a date condition, older ones dated, first
    expect(base6.tariff.components[0].rules).to.deep.equal([
      { when: { dates: { from: '2023-02-01', to: '2024-01-31' } }, price: 0.2276 },
    ]);
    expect(base6.tariff.components[0].fallback).to.deep.equal({ price: 0.2516 });
    expect(base6.tariff.components.map((c) => c.key)).to.deep.equal([
      'energy',
      'subscription',
      'subscription-2023-02-01',
    ]);
    expect(base6.tariff.components[2].when).to.deep.equal({ dates: { from: '2023-02-01', to: '2024-01-31' } });
    const peak = catalogue.templates[2];
    expect(peak.inputs.map((i) => i.key)).to.deep.equal(['off_peak_slots']);
    expect(peak.tariff.components[0].rules[0].when.time).to.equal('{{input:off_peak_slots}}');
    expect(peak.tariff.components[0].fallback.price).to.equal(0.27);
    const tempo = catalogue.templates[3];
    expect(tempo.calendars).to.deep.equal(['tempo']);
    expect(tempo.tariff.calendars).to.deep.equal(['tempo']);
    expect(tempo.tariff.components[0].rules.map((r) => r.label)).to.deep.equal([
      'red peak',
      'red off-peak',
      'blue peak',
      'blue off-peak',
    ]);
    expect(tempo.tariff.components[0].rules[0].when).to.deep.equal({
      calendar: { tempo: 'red' },
      time: [['06:00', '08:00']],
    });
    expect(tempo.tariff.components[0].fallback).to.deep.equal({ label: 'off-peak', price: 0.1296 });
    // the service endpoint keeps the v1 shape
    const handler = new EnergyMonitoring(
      { energyContract, job: { wrapper: (t, f) => f }, event: { on: () => null } },
      'id',
    );
    expect(await handler.getContracts()).to.deep.equal(V1_CATALOGUE);
  });

  it('should fail on a release without catalogue or with an invalid file', async () => {
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, RELEASE([{ name: 'other.txt', browser_download_url: 'x' }]));
    await expect(energyContract.getCatalogue()).to.be.rejectedWith('contracts.json not found in the latest release');
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, RELEASE([{ name: 'contracts-v2.json', browser_download_url: V2_URL }]));
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v2.0.0/contracts-v2.json')
      .reply(200, { nope: true });
    await expect(energyContract.getCatalogue()).to.be.rejectedWith('contracts-v2.json must contain a templates array');
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, RELEASE([{ name: 'contracts.json', browser_download_url: V1_URL }]));
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v2.0.0/contracts.json')
      .reply(200, 'not json');
    await expect(energyContract.getCatalogue()).to.be.rejectedWith('contracts.json must be a valid JSON object');
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, { tag_name: 'v1' });
    await expect(energyContract.getCatalogue({ force: true })).to.be.rejectedWith('contracts.json not found');
  });

  it('should convert v1 hour slots crossing midnight and legacy indexes', () => {
    const [template] = convertCatalogueV1({
      k: {
        '6': [
          {
            contract: 'peak-off-peak',
            price_type: 'consumption',
            currency: 'euro',
            start_date: '2024-01-01',
            price: 1000,
            hour_slots: '23:00,23:30,00:00,00:30',
          },
          {
            contract: 'peak-off-peak',
            price_type: 'consumption',
            currency: 'euro',
            start_date: '2024-01-01',
            price: 2000,
            hour_slots: '1,2,30,31',
          },
          {
            contract: 'peak-off-peak',
            price_type: 'consumption',
            currency: 'euro',
            start_date: '2024-01-01',
            price: 3000,
            hour_slots: '7,8,9,10,11,12,13,14,15,16',
          },
        ],
      },
    });
    const [energy] = template.tariff.components;
    expect(energy.rules.map((r) => [r.when.time, r.price])).to.deep.equal([
      [[['23:00', '01:00']], 0.1],
      [
        [
          ['01:00', '03:00'],
          ['15:00', '16:00'],
        ],
        0.2,
      ],
    ]);
    expect(energy.fallback.price).to.equal(0.3);
  });

  it('should merge the internal, integration and community templates, the catalogue being optional', async () => {
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(500, {});
    stateManager.setState('service', 'edf-tempo', {
      energyContracts: { templates: [EDF_TEMPO_TEMPLATE], calendars: [TEMPO_CALENDAR] },
    });
    stateManager.setState('service', 'other', { start: () => null });
    const service = await db.Service.create({
      name: 'ext-dev-hq',
      selector: 'ext-dev-hq',
      version: '1.0.0',
      status: 'STOPPED',
      type: 'external',
      manifest: {
        name: 'Hydro-Québec',
        energy_contracts: {
          templates: [
            {
              key: 'hq-d',
              name: { en: 'Rate D' },
              pricing_mode: 'rules',
              version: '1',
              tariff: { tariff_version: 1, components: [] },
            },
          ],
        },
      },
    });
    await db.Service.create({
      name: 'ext-dev-none',
      selector: 'ext-dev-none',
      version: '1',
      status: 'RUNNING',
      type: 'external',
      manifest: { name: 'None' },
    });
    const templates = await energyContract.getTemplates();
    expect(templates.map((t) => [t.key, t.provider.kind])).to.deep.equal([
      ['edf-tempo', 'internal'],
      ['hq-d', 'integration'],
    ]);
    expect(templates[0].tariff).to.equal(undefined);
    expect(templates[1].provider).to.deep.include({ service_id: service.id, name: 'Hydro-Québec', running: false });
    const full = await energyContract.getTemplate('internal', 'edf-tempo');
    expect(full.tariff.calendars).to.deep.equal(['tempo']);
    const byService = await energyContract.getTemplate('integration', 'hq-d', { service_id: service.id });
    expect(byService.provider.selector).to.equal('ext-dev-hq');
    await expect(energyContract.getTemplate('integration', 'hq-d', { service_id: 'other' })).to.be.rejectedWith(
      'ENERGY_CONTRACT_TEMPLATE_NOT_FOUND',
    );
    await expect(energyContract.getTemplate('community', 'edf-base')).to.be.rejected;
  });

  it('should select a community template variant', async () => {
    nock('https://api.github.com')
      .get('/repos/GladysAssistant/energy-contracts/releases/latest')
      .reply(200, RELEASE([{ name: 'contracts.json', browser_download_url: V1_URL }]));
    nock('https://github.com')
      .get('/GladysAssistant/energy-contracts/releases/download/v2.0.0/contracts.json')
      .reply(200, V1_CATALOGUE);
    const nine = await energyContract.getTemplate('community', 'edf-base', { variant: '9' });
    expect(nine.subscribed_power).to.equal(9);
    const first = await energyContract.getTemplate('community', 'edf-base');
    expect(first.subscribed_power).to.equal(6);
    await expect(energyContract.getTemplate('community', 'edf-base', { variant: '12' })).to.be.rejectedWith(
      'ENERGY_CONTRACT_TEMPLATE_NOT_FOUND',
    );
  });

  it('should ship a valid internal EDF Tempo template', () => {
    const inputs = {};
    EDF_TEMPO_TEMPLATE.inputs.forEach((input) => {
      inputs[input.key] = input.default;
    });
    const tariff = validateTariff(substituteInputs(EDF_TEMPO_TEMPLATE.tariff, inputs));
    expect(tariff.components[0].rules[0].price).to.equal(0.7562);
    expect(tariff.components[1].amount).to.equal(17.11);
  });
});
