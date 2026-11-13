import { Text } from 'preact-i18n';

// The meter picker of the energy price widget and of the energy price scenes
// (docs/specs/energy-contracts.md 8.2): one option per meter carrying a contract,
// with the name of its active contract, after an empty option that means the
// main meter (`emptyOption="main"`, widget and condition) or any meter
// (`emptyOption="any"`, trigger). `legacyContract` is the contract selector a
// setting saved before the meter targeting still carries because it could not be
// read as a meter (the contract was deleted): the user is asked to pick a meter.
const ElectricMeterSelect = ({ meters, mainMeter, value, onChange, emptyOption, legacyContract }) => {
  const unknownValue = value && !meters.some(meter => meter.selector === value);
  return (
    <div>
      <select class="form-control" value={value || ''} onChange={onChange}>
        <option value="">
          {emptyOption === 'any' && <Text id="integration.energyMonitoring.meterSelect.anyMeter" />}
          {emptyOption !== 'any' && mainMeter && (
            <Text id="integration.energyMonitoring.meterSelect.mainMeterNamed" fields={{ name: mainMeter.name }} />
          )}
          {emptyOption !== 'any' && !mainMeter && <Text id="integration.energyMonitoring.meterSelect.mainMeter" />}
        </option>
        {meters.map(meter => (
          <option key={meter.selector} value={meter.selector}>
            {meter.name} —{' '}
            {meter.activeContract ? (
              meter.activeContract.name
            ) : (
              <Text id="integration.energyMonitoring.meterSelect.noActiveContract" />
            )}
          </option>
        ))}
        {unknownValue && <option value={value}>{value}</option>}
      </select>
      {legacyContract && !value && (
        <small class="form-text text-warning">
          <Text id="integration.energyMonitoring.meterSelect.deletedContract" />
        </small>
      )}
    </div>
  );
};

export default ElectricMeterSelect;
