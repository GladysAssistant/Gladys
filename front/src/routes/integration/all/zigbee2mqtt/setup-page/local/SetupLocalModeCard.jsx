import { Text, MarkupText } from 'preact-i18n';

import { SETUP_MODES } from '../constants';
import InstallationCard from '../components/InstallationCard';
import Requirement from '../components/Requirement';

const SetupLocalModeCard = ({ dockerBased, networkModeValid, usbConfigured, disabled, selectSetupMode }) => (
  <InstallationCard
    title={<Text id="integration.zigbee2mqtt.setup.modes.local.title" />}
    disabled={!dockerBased || !networkModeValid || disabled}
    setupMode={SETUP_MODES.LOCAL}
    selectSetupMode={selectSetupMode}
    dataCy="z2m-setup-local-panel"
  >
    <p>
      <Text id="integration.zigbee2mqtt.setup.modes.local.description" />
    </p>
    <small>
      <MarkupText id="integration.zigbee2mqtt.setup.requirementsLabel" />
      <ul class="list-unstyled">
        <li>
          <Requirement verified={dockerBased} mandatory>
            <Text id="integration.zigbee2mqtt.setup.modes.local.dockerInstallationRequirementLabel" />
          </Requirement>
        </li>
        <li>
          <Requirement verified={dockerBased && networkModeValid} mandatory>
            <Text id="integration.zigbee2mqtt.setup.modes.local.dockerNetworkHostRequirementLabel" />
          </Requirement>
        </li>
        <li>
          <Requirement verified={usbConfigured}>
            <Text id="integration.zigbee2mqtt.setup.modes.local.usbDongleRequirementLabel" />
          </Requirement>
        </li>
      </ul>
    </small>
  </InstallationCard>
);

export default SetupLocalModeCard;
