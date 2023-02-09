import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import InstallationCard from './InstallationCard';

const InstallationModePanel = ({ dockerBased, networkModeValid, usbConfigured, selectMode }) => (
  <div class="card-deck">
    <InstallationCard
      titleId="integration.zigbee2mqtt.setup.allInOneLabel"
      disabled={!dockerBased || !networkModeValid}
      setupMode="allInOne"
      selectMode={selectMode}
    >
      <p>
        <Text id="integration.zigbee2mqtt.setup.allInOneDescription" />
      </p>
      <small>
        <u>
          <Text id="integration.zigbee2mqtt.setup.requirementsLabel" />
        </u>
        <ul class="list-unstyled">
          <li>
            <i
              class={cx('fe', 'mr-2', {
                'fe-check-circle text-success': dockerBased,
                'fe-x-circle text-danger': !dockerBased
              })}
            />
            <Text id="integration.zigbee2mqtt.setup.dockerInstallationRequirementLabel" />
          </li>
          <li>
            <i
              class={cx('fe', 'mr-2', {
                'fe-check-circle text-success': networkModeValid,
                'fe-x-circle text-danger': !networkModeValid
              })}
            />
            <Text id="integration.zigbee2mqtt.setup.dockerNetworkHostRequirementLabel" />
          </li>
          <li>
            <i
              class={cx('fe', 'mr-2', {
                'fe-check-circle text-success': usbConfigured,
                'fe-help-circle text-primary': !usbConfigured
              })}
            />
            <Text id="integration.zigbee2mqtt.setup.usbDongleRequirementLabel" />
          </li>
        </ul>
      </small>
    </InstallationCard>
    <InstallationCard
      titleId="integration.zigbee2mqtt.setup.advancedLabel"
      setupMode="customInstallation"
      selectMode={selectMode}
    >
      <p>
        <MarkupText id="integration.zigbee2mqtt.setup.advancedDescription" />
      </p>
    </InstallationCard>
  </div>
);

export default InstallationModePanel;
