import { Text, MarkupText } from 'preact-i18n';

import { SETUP_MODES } from '../constants';
import InstallationCard from '../components/InstallationCard';
import Requirement from '../components/Requirement';

const SetupRemoteModeCard = ({ selectSetupMode, disabled }) => (
  <InstallationCard
    title={<Text id="integration.zigbee2mqtt.setup.modes.remote.title" />}
    disabled={disabled}
    setupMode={SETUP_MODES.REMOTE}
    selectSetupMode={selectSetupMode}
    dataCy="z2m-setup-remote-panel"
  >
    <p>
      <Text id="integration.zigbee2mqtt.setup.modes.remote.description" />
    </p>
    <small>
      <MarkupText id="integration.zigbee2mqtt.setup.requirementsLabel" />
      <ul class="list-unstyled">
        <li>
          <Requirement>
            <Text id="integration.zigbee2mqtt.setup.modes.remote.z2mInstallationRequirementLabel" />
          </Requirement>
        </li>
        <li>
          <Requirement>
            <Text id="integration.zigbee2mqtt.setup.modes.remote.mqttBrokerRequirementLabel" />
          </Requirement>
        </li>
      </ul>
    </small>
  </InstallationCard>
);

export default SetupRemoteModeCard;
