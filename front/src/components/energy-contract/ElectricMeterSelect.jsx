import { Text } from 'preact-i18n';

// The meter picker of the energy price widget and of the energy price scenes
// (docs/specs/energy-contracts.md 8.2): one option per meter carrying a contract,
// with the name of its active contract, after an empty option that means the
// main meter (`emptyOption="main"`, widget and condition) or any meter
// (`emptyOption="any"`, trigger). `legacyContract` is the contract selector a
// setting saved before the meter targeting still carries because it could not be
// read as a meter (the contract was deleted): the user is asked to pick a meter.
// It selects a placeholder of its own rather than the empty option, so that
// choosing the main meter (or any meter) changes the selection and replaces the
// stale contract.
const UNRESOLVED_LEGACY_CONTRACT = '__unresolved_legacy_contract__';

const ElectricMeterSelect = ({ meters, mainMeter, value, onChange, emptyOption, legacyContract }) => {
  const unresolvedLegacyContract = legacyContract && !value;
  const unknownValue = value && !meters.some(meter => meter.selector === value);
  return (
    <div>
      <select
        class="form-control"
        value={unresolvedLegacyContract ? UNRESOLVED_LEGACY_CONTRACT : value || ''}
        onChange={onChange}
      >
        {unresolvedLegacyContract && (
          <option value={UNRESOLVED_LEGACY_CONTRACT} disabled>
            <Text id="global.emptySelectOption" />
          </option>
        )}
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
      {unresolvedLegacyContract && (
        <small class="form-text text-warning">
          <Text id="integration.energyMonitoring.meterSelect.deletedContract" />
        </small>
      )}
    </div>
  );
};

export default ElectricMeterSelect;
