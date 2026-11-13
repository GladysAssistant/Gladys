// The electric meters an energy price widget or an energy price scene can target
// (docs/specs/energy-contracts.md 8.2). The price is the one of the contract
// active on the meter at each call, so the user picks a meter, never a contract:
// a tariff change (the previous contract ended, its successor created) then needs
// no reconfiguration. The meters are read from the contract list
// (GET /api/v1/energy_contract), each contract carrying its `electric_meter_device`.

const isConsumptionContract = contract => !contract.direction || contract.direction === 'consumption';

// The meters carrying a consumption contract, by name, each with its contracts and
// its active one (or null), and the main meter: the meter of the most recently
// created consumption contract, the one the server prices when none is named
export const getElectricMeters = contracts => {
  const meters = new Map();
  let mostRecent = null;
  (contracts || []).filter(isConsumptionContract).forEach(contract => {
    const device = contract.electric_meter_device;
    if (!device) {
      return;
    }
    if (!meters.has(device.id)) {
      meters.set(device.id, { ...device, contracts: [] });
    }
    meters.get(device.id).contracts.push(contract);
    if (!mostRecent || new Date(contract.created_at) > new Date(mostRecent.created_at)) {
      mostRecent = contract;
    }
  });
  const list = [...meters.values()]
    .map(meter => ({
      ...meter,
      activeContract: meter.contracts.find(contract => contract.status === 'active') || null
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const mainMeter = mostRecent ? list.find(meter => meter.id === mostRecent.electric_meter_device_id) : null;
  return { meters: list, mainMeter: mainMeter || null };
};

// A widget or a scene saved before the meter targeting names a contract: it is
// read as the meter of that contract (null when the contract no longer exists)
export const getMeterSelectorOfContract = (contracts, contractSelector) => {
  const contract = (contracts || []).find(candidate => candidate.selector === contractSelector);
  return contract && contract.electric_meter_device ? contract.electric_meter_device.selector : null;
};

// The meter a setting targets: the named one, else the main meter
export const getTargetedMeter = ({ meters, mainMeter }, meterSelector) =>
  meterSelector ? meters.find(meter => meter.selector === meterSelector) || null : mainMeter;
