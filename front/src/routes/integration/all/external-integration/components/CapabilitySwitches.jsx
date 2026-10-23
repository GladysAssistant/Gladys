import { Text } from 'preact-i18n';

// One row per Linux capability requested by the manifest sub-containers: a
// plain-language explanation, the containers requesting it and a grant
// switch. The allowlist is Docker's default capability set (what a plain
// `docker run` grants): a granted capability gives back part of that
// default, never more. Requesting is done by the manifest, granting is a
// user gesture — the effective CapAdd is requested ∩ granted.
const CapabilitySwitches = ({ containers = [], requestedCapabilities, granted = [], onToggle, disabled }) => (
  <div>
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

export default CapabilitySwitches;
