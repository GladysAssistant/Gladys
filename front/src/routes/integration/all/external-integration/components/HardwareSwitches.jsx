import { Text } from 'preact-i18n';

// One row per hardware class requested by the manifest: detection state and
// a grant switch. Requesting is done by the manifest, granting is a user
// gesture — the effective mount is requested ∩ granted ∩ present.
const HardwareSwitches = ({ requestedClasses, detectedClasses = {}, granted = [], onToggle, disabled }) => (
  <div>
    {requestedClasses.map(hardwareClass => (
      <label class="custom-switch d-flex align-items-center mb-2">
        <input
          type="checkbox"
          class="custom-switch-input"
          checked={granted.includes(hardwareClass)}
          onClick={() => onToggle(hardwareClass)}
          disabled={disabled}
        />
        <span class="custom-switch-indicator" />
        <span class="custom-switch-description d-flex align-items-center">
          <Text id={`integration.externalIntegration.hardware.classes.${hardwareClass}`} />
          {detectedClasses[hardwareClass] ? (
            <span class="badge badge-success ml-2">
              <Text id="integration.externalIntegration.hardware.detected" />
            </span>
          ) : (
            <span class="badge badge-secondary ml-2">
              <Text id="integration.externalIntegration.hardware.notDetected" />
            </span>
          )}
        </span>
      </label>
    ))}
  </div>
);

export default HardwareSwitches;
