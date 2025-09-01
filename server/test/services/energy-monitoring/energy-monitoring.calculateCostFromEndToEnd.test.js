const { fake } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const db = require('../../../models');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ENERGY_CONTRACT_TYPES,
  ENERGY_PRICE_TYPES,
  ENERGY_PRICE_DAY_TYPES,
  SYSTEM_VARIABLE_NAMES,
} = require('../../../utils/constants');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const EnergyPrice = require('../../../lib/energy-price');

const event = new EventEmitter();
const job = new Job(event);

const brain = {
  addNamedEntity: fake.returns(null),
  removeNamedEntity: fake.returns(null),
};
const variable = {
  getValue: (name) => {
    if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
      return 'Europe/Paris';
    }
    return null;
  },
};

describe('EnergyMonitoring.calculateCostFrom', () => {
  let stateManager;
  let serviceManager;
  let device;
  let energyPrice;
  let electricalMeterDevice;
  let gladys;

  // Import all EDF Tempo prices from CSV and create 6 entries per period
  // (Blue/White/Red x Off-peak/Peak) using TTC values.
  const importAllTempoPricesFromCsv = async (electricMeterDeviceId, energyPriceInstance) => {
    const csvPath = path.join(__dirname, 'data', 'tempo_pricing.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('tempo_pricing.csv is empty');
    }
    const header = lines[0].split(';');
    const col = (name) => header.indexOf(name);
    const idx = {
      DATE_DEBUT: col('DATE_DEBUT'),
      P_SOUSCRITE: col('P_SOUSCRITE'),
      PART_VARIABLE_HCBleu_TTC: col('PART_VARIABLE_HCBleu_TTC'),
      PART_VARIABLE_HPBleu_TTC: col('PART_VARIABLE_HPBleu_TTC'),
      PART_VARIABLE_HCBlanc_TTC: col('PART_VARIABLE_HCBlanc_TTC'),
      PART_VARIABLE_HPBlanc_TTC: col('PART_VARIABLE_HPBlanc_TTC'),
      PART_VARIABLE_HCRouge_TTC: col('PART_VARIABLE_HCRouge_TTC'),
      PART_VARIABLE_HPRouge_TTC: col('PART_VARIABLE_HPRouge_TTC'),
    };
    const parsePriceInt = (s) => {
      if (!s) {
        return null;
      }
      const n = parseFloat(String(s).replace(',', '.'));
      if (Number.isNaN(n)) {
        return null;
      }
      return Math.round(n * 10000);
    };
    const offPeak = '1,2,3,4,5,22,23';
    const peak = '6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21';

    // Build period start dates from rows where P_SOUSCRITE = '6'
    const sixKvaStartDates = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = lines[i].split(';');
      if (cols[idx.DATE_DEBUT] && cols[idx.P_SOUSCRITE] === '6') {
        const [dd, mm, yyyy] = cols[idx.DATE_DEBUT].split('/');
        sixKvaStartDates.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    const uniqueSixDates = Array.from(new Set(sixKvaStartDates)).sort((a, b) => (a < b ? -1 : 1));

    // For each selected start date, fetch actual prices from any row of that date which has values
    const dataRows = lines.slice(1).map((l) => l.split(';'));
    const periods = uniqueSixDates
      .map((startDateIso) => {
        const [yyyy, mm, dd] = startDateIso.split('-');
        const startDateFr = `${dd}/${mm}/${yyyy}`;
        const pricedRow = dataRows.find((r) => {
          if (r[idx.DATE_DEBUT] !== startDateFr) {
            return false;
          }
          const vals = [
            r[idx.PART_VARIABLE_HCBleu_TTC],
            r[idx.PART_VARIABLE_HPBleu_TTC],
            r[idx.PART_VARIABLE_HCBlanc_TTC],
            r[idx.PART_VARIABLE_HPBlanc_TTC],
            r[idx.PART_VARIABLE_HCRouge_TTC],
            r[idx.PART_VARIABLE_HPRouge_TTC],
          ];
          return vals.every((v) => v && String(v).trim() !== '');
        });
        if (!pricedRow) {
          return null;
        }
        const blueOff = parsePriceInt(pricedRow[idx.PART_VARIABLE_HCBleu_TTC]);
        const bluePeak = parsePriceInt(pricedRow[idx.PART_VARIABLE_HPBleu_TTC]);
        const whiteOff = parsePriceInt(pricedRow[idx.PART_VARIABLE_HCBlanc_TTC]);
        const whitePeak = parsePriceInt(pricedRow[idx.PART_VARIABLE_HPBlanc_TTC]);
        const redOff = parsePriceInt(pricedRow[idx.PART_VARIABLE_HCRouge_TTC]);
        const redPeak = parsePriceInt(pricedRow[idx.PART_VARIABLE_HPRouge_TTC]);
        return {
          startDateIso,
          blueOff,
          bluePeak,
          whiteOff,
          whitePeak,
          redOff,
          redPeak,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.startDateIso < b.startDateIso ? -1 : 1));

    const createPromises = [];
    for (let i = 0; i < periods.length; i += 1) {
      const p = periods[i];
      const next = periods[i + 1];
      const endDateIso = next ? next.startDateIso : null;
      // BLUE
      createPromises.push(
        energyPriceInstance.create({
          electric_meter_device_id: electricMeterDeviceId,
          contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
          price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
          currency: 'euro',
          start_date: p.startDateIso,
          end_date: endDateIso,
          price: p.blueOff,
          hour_slots: offPeak,
          day_type: ENERGY_PRICE_DAY_TYPES.BLUE,
        }),
        energyPriceInstance.create({
          electric_meter_device_id: electricMeterDeviceId,
          contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
          price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
          currency: 'euro',
          start_date: p.startDateIso,
          end_date: endDateIso,
          price: p.bluePeak,
          hour_slots: peak,
          day_type: ENERGY_PRICE_DAY_TYPES.BLUE,
        }),
        // WHITE
        energyPriceInstance.create({
          electric_meter_device_id: electricMeterDeviceId,
          contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
          price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
          currency: 'euro',
          start_date: p.startDateIso,
          end_date: endDateIso,
          price: p.whiteOff,
          hour_slots: offPeak,
          day_type: ENERGY_PRICE_DAY_TYPES.WHITE,
        }),
        energyPriceInstance.create({
          electric_meter_device_id: electricMeterDeviceId,
          contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
          price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
          currency: 'euro',
          start_date: p.startDateIso,
          end_date: endDateIso,
          price: p.whitePeak,
          hour_slots: peak,
          day_type: ENERGY_PRICE_DAY_TYPES.WHITE,
        }),
        // RED
        energyPriceInstance.create({
          electric_meter_device_id: electricMeterDeviceId,
          contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
          price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
          currency: 'euro',
          start_date: p.startDateIso,
          end_date: endDateIso,
          price: p.redOff,
          hour_slots: offPeak,
          day_type: ENERGY_PRICE_DAY_TYPES.RED,
        }),
        energyPriceInstance.create({
          electric_meter_device_id: electricMeterDeviceId,
          contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
          price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
          currency: 'euro',
          start_date: p.startDateIso,
          end_date: endDateIso,
          price: p.redPeak,
          hour_slots: peak,
          day_type: ENERGY_PRICE_DAY_TYPES.RED,
        }),
      );
    }
    await Promise.all(createPromises);
  };
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    stateManager = new StateManager(event);
    serviceManager = new ServiceManager({}, stateManager);
    device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);
    energyPrice = new EnergyPrice();
    gladys = {
      variable,
      device,
      energyPrice,
      job: {
        updateProgress: fake.returns(null),
        wrapper: (name, func) => func,
      },
    };
    // We create a new electrical meter device
    electricalMeterDevice = await device.create({
      id: 'd1fe2ab9-8c50-4053-ac40-83421f899c59',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Electrical Meter',
      external_id: 'electrical-meter',
      selector: 'electrical-meter',
      features: [
        {
          id: '17488546-e1b8-4cb9-bd75-e20526a94a99',
          selector: 'electrical-meter-consumption',
          external_id: 'electrical-meter-consumption',
          name: 'Electrical meter Consumption',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        },
        {
          id: '0f4133be-b86c-4a97-9cc8-585fadb74006',
          selector: 'electrical-meter-consumption-cost',
          external_id: 'electrical-meter-consumption-cost',
          name: 'Electrical meter Consumption Cost',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
        },
      ],
    });
  });
  it('should calculate cost from a specific date for a edf-tempo contract', async () => {
    await importAllTempoPricesFromCsv(electricalMeterDevice.id, energyPrice);
    await db.duckDbBatchInsertState('17488546-e1b8-4cb9-bd75-e20526a94a99', [
      {
        value: 10,
        // RED day, off peak
        created_at: dayjs.tz('2025-01-03T05:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // RED day, peak
        created_at: dayjs.tz('2025-01-03T10:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // WHITE day, off peak
        created_at: dayjs.tz('2025-01-04T05:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // WHITE day, peak
        created_at: dayjs.tz('2025-01-04T15:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // BLUE day, off peak
        created_at: dayjs.tz('2025-01-05T05:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // BLUE day, peak
        created_at: dayjs.tz('2025-01-05T15:30:00.000Z', 'Europe/Paris').toDate(),
      },
    ]);
    const energyMonitoring = new EnergyMonitoring(gladys, '43732e67-6669-4a95-83d6-38c50b835387');
    const date = new Date('2025-01-01T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date);
    const deviceFeatureState = await device.getDeviceFeatureStates(
      'electrical-meter-consumption-cost',
      dayjs.tz('2025-01-01T00:00:00.000Z', 'Europe/Paris').toDate(),
      dayjs.tz('2025-12-01T00:00:00.000Z', 'Europe/Paris').toDate(),
    );
    expect(deviceFeatureState).to.have.lengthOf(6);
    expect(deviceFeatureState[0]).to.have.property('value', 10 * 0.1568);
    expect(deviceFeatureState[1]).to.have.property('value', 10 * 0.7562);
    expect(deviceFeatureState[2]).to.have.property('value', 10 * 0.1486);
    expect(deviceFeatureState[3]).to.have.property('value', 10 * 0.1894);
    expect(deviceFeatureState[4]).to.have.property('value', 10 * 0.1296);
    expect(deviceFeatureState[5]).to.have.property('value', 10 * 0.1609);
  });
});
