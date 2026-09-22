// Templates and calendars provided by the core's internal services (section 4 of the
// capability file: `internal` provider). The Tempo colour calendar is fed by the
// edf-tempo service from the Gladys Plus data; the template prices are the inputs.
const TEMPO_CALENDAR_KEY = 'tempo';

const TEMPO_CALENDAR = {
  key: TEMPO_CALENDAR_KEY,
  granularity: 'day',
  timezone: 'Europe/Paris',
  day_starts_at: '06:00',
  values: ['blue', 'white', 'red'],
};

const PEAK = [['06:00', '22:00']];

const EDF_TEMPO_TEMPLATE = {
  key: 'edf-tempo',
  name: { en: 'EDF Tempo', fr: 'EDF Tempo' },
  country: 'FR',
  currency: 'EUR',
  timezone: 'Europe/Paris',
  pricing_mode: 'rules',
  version: '2026-02-01',
  calendars: [TEMPO_CALENDAR_KEY],
  inputs: [
    {
      key: 'subscribed_power',
      type: 'select',
      label: { en: 'Subscribed power (kVA)', fr: 'Puissance souscrite (kVA)' },
      options: ['6', '9', '12', '15', '18', '30', '36'],
      default: '9',
    },
    {
      key: 'blue_peak',
      type: 'number',
      unit: 'EUR/kWh',
      label: { en: 'Blue day, peak hours', fr: 'Jour bleu, heures pleines' },
      default: 0.1609,
    },
    {
      key: 'blue_off_peak',
      type: 'number',
      unit: 'EUR/kWh',
      label: { en: 'Blue day, off-peak hours', fr: 'Jour bleu, heures creuses' },
      default: 0.1296,
    },
    {
      key: 'white_peak',
      type: 'number',
      unit: 'EUR/kWh',
      label: { en: 'White day, peak hours', fr: 'Jour blanc, heures pleines' },
      default: 0.1894,
    },
    {
      key: 'white_off_peak',
      type: 'number',
      unit: 'EUR/kWh',
      label: { en: 'White day, off-peak hours', fr: 'Jour blanc, heures creuses' },
      default: 0.1486,
    },
    {
      key: 'red_peak',
      type: 'number',
      unit: 'EUR/kWh',
      label: { en: 'Red day, peak hours', fr: 'Jour rouge, heures pleines' },
      default: 0.7562,
    },
    {
      key: 'red_off_peak',
      type: 'number',
      unit: 'EUR/kWh',
      label: { en: 'Red day, off-peak hours', fr: 'Jour rouge, heures creuses' },
      default: 0.1568,
    },
    {
      key: 'subscription',
      type: 'number',
      unit: 'EUR/month',
      label: { en: 'Monthly subscription', fr: 'Abonnement mensuel' },
      default: 17.11,
    },
  ],
  tariff: {
    tariff_version: 1,
    calendars: [TEMPO_CALENDAR_KEY],
    components: [
      {
        key: 'energy',
        kind: 'consumption',
        rules: [
          { label: 'Red peak', when: { calendar: { tempo: 'red' }, time: PEAK }, price: '{{input:red_peak}}' },
          { label: 'Red off-peak', when: { calendar: { tempo: 'red' } }, price: '{{input:red_off_peak}}' },
          { label: 'White peak', when: { calendar: { tempo: 'white' }, time: PEAK }, price: '{{input:white_peak}}' },
          { label: 'White off-peak', when: { calendar: { tempo: 'white' } }, price: '{{input:white_off_peak}}' },
          { label: 'Blue peak', when: { calendar: { tempo: 'blue' }, time: PEAK }, price: '{{input:blue_peak}}' },
        ],
        fallback: { label: 'Blue off-peak', price: '{{input:blue_off_peak}}' },
      },
      { key: 'subscription', kind: 'fixed', amount: '{{input:subscription}}', per: 'month' },
    ],
  },
};

module.exports = {
  TEMPO_CALENDAR_KEY,
  TEMPO_CALENDAR,
  EDF_TEMPO_TEMPLATE,
};
