import { Text } from 'preact-i18n';

// One row per Linux capability requested by the manifest sub-containers: a
// plain-language explanation, the containers requesting it and a grant
// switch. The allowlist is need-based (the init-as-root subset an upstream
// image needs) and strictly inside Docker's default set: a granted
// capability gives back part of what a plain `docker run` grants, never
// more. Requesting is done by the manifest, granting is a user gesture —
// the switches start off (unlike detected hardware, which is pre-checked)
// and the "grant all" checkbox is the one deliberate gesture that turns
// them all on; the effective CapAdd is requested ∩ granted ∩ allowlist.
const CapabilitySwitches = ({
  containers = [],
  requestedCapabilities,
  granted = [],
  onToggle,
  onToggleAll,
  disabled
}) => {
  const allGranted = requestedCapabilities.every(capability => granted.includes(capability));
  return (
    <div>
      <div class="alert alert-warning small">
        <Text id="integration.externalIntegration.capabilities.requiredWarning" />
      </div>
      <label class="custom-control custom-checkbox mb-3">
        <input
          type="checkbox"
          class="custom-control-input"
          checked={allGranted}
          onClick={() => onToggleAll(!allGranted)}
          disabled={disabled}
        />
        <span class="custom-control-label">
          <Text
            id="integration.externalIntegration.capabilities.grantAll"
            plural={requestedCapabilities.length}
            fields={{ count: requestedCapabilities.length }}
          />
        </span>
      </label>
      {requestedCapabilities.map(capability => (
        <label class="custom-switch d-flex align-items-start mb-2">
          <input
            type="checkbox"
            class="custom-switch-input"
            checked={granted.includes(capability)}
            onClick={() => onToggle(capability)}
            disabled={disabled}
          />
          <span class="custom-switch-indicator mt-1" />
          <span class="custom-switch-description">
            <code>{capability}</code>{' '}
            <small class="text-muted">
              (
              {containers
                .filter(container => (container.capabilities || []).includes(capability))
                .map(container => container.name)
                .join(', ')}
              )
            </small>
            <br />
            <small>
              <Text id={`integration.externalIntegration.capabilities.descriptions.${capability}`} />
            </small>
          </span>
        </label>
      ))}
    </div>
  );
};

export default CapabilitySwitches;
