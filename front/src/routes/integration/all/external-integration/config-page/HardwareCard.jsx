import { Text } from 'preact-i18n';
import cx from 'classnames';

import HardwareSwitches from '../components/HardwareSwitches';
import CapabilitySwitches from '../components/CapabilitySwitches';
import { RequestStatus } from '../../../../../utils/consts';

// Same switches as the install screen — hardware classes and Linux
// capabilities —, editable at any time (admin): a save posts only the grant
// list(s) that changed, so it recreates only the sub-containers requesting
// what changed, and notifies the integration (hardware-updated) so it adapts
// its configuration.
const HardwareCard = ({
  containers,
  requestedClasses,
  detectedClasses,
  grantedDevices,
  requestedCapabilities,
  grantedCapabilities,
  hardwareStatus,
  onToggle,
  onToggleCapability,
  onToggleAllCapabilities,
  onSave
}) => {
  const saving = hardwareStatus === RequestStatus.Getting;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.externalIntegration.hardware.title" />
        </h3>
      </div>
      <div class="card-body">
        {requestedClasses.length > 0 && (
          <p class="text-muted small">
            <Text id="integration.externalIntegration.hardware.configDescription" />
          </p>
        )}
        {hardwareStatus === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="integration.externalIntegration.hardware.saveError" />
          </div>
        )}
        <HardwareSwitches
          requestedClasses={requestedClasses}
          detectedClasses={detectedClasses}
          granted={grantedDevices}
          onToggle={onToggle}
          disabled={saving}
        />
        {requestedCapabilities.length > 0 && (
          <div class={cx({ 'mt-3': requestedClasses.length > 0 })}>
            <h4>
              <Text id="integration.externalIntegration.capabilities.title" />
            </h4>
            <p class="text-muted small">
              <Text id="integration.externalIntegration.capabilities.configDescription" />
            </p>
            <CapabilitySwitches
              containers={containers}
              requestedCapabilities={requestedCapabilities}
              granted={grantedCapabilities}
              onToggle={onToggleCapability}
              onToggleAll={onToggleAllCapabilities}
              disabled={saving}
            />
          </div>
        )}
        <button class={cx('btn btn-primary mt-2', { 'btn-loading': saving })} onClick={onSave} disabled={saving}>
          <Text id="integration.externalIntegration.hardware.saveButton" />
        </button>
      </div>
    </div>
  );
};

export default HardwareCard;
