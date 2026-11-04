import { Fragment } from 'preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../../../utils/consts';

import ContainerStatus from '../components/ContainerStatus';
import ContainerLinkStatus from '../components/ContainerLinkStatus';

const RunningStatus = ({ zigbee2mqttStatus = {}, setupZigee2mqttStatus }) => {
  const loading = setupZigee2mqttStatus === RequestStatus.Getting;
  const { gladysConnected, zigbee2mqttConnected, zigbee2mqttStarting, z2mContainerError } = zigbee2mqttStatus;
  // Gladys hears the broker, but Zigbee2mqtt has not answered yet (in external mode too, without container)
  const zigbee2mqttWaiting = !loading && gladysConnected && !zigbee2mqttConnected;
  // Starting only when Gladys has just (re)started its container and no startup error was read: a stopped
  // Zigbee2mqtt must not be shown as starting
  const starting = zigbee2mqttWaiting && zigbee2mqttStarting && !z2mContainerError;
  let explanationKey = 'integration.zigbee2mqtt.setup.zigbee2mqttNotResponding';
  if (starting) {
    explanationKey = 'integration.zigbee2mqtt.setup.zigbee2mqttStarting';
  } else if (z2mContainerError) {
    explanationKey = 'integration.zigbee2mqtt.setup.zigbee2mqttNotStarting';
  }

  return (
    <Fragment>
      <div class="form-label">
        <Text id="integration.zigbee2mqtt.setup.serviceStatus" />
      </div>
      <div class="w-100 mx-auto mt-3">
        <div class="d-flex flex-column flex-sm-row justify-content-center">
          <ContainerStatus
            exists
            running
            imageSrc="/assets/icons/favicon-96x96.png"
            title={<Text id="integration.zigbee2mqtt.setup.gladys" />}
          />
          <ContainerLinkStatus loading={loading} linked={zigbee2mqttStatus.gladysConnected} />
          <ContainerStatus
            loading={loading}
            exists={zigbee2mqttStatus.mqttExist}
            running={zigbee2mqttStatus.mqttRunning}
            imageSrc="/assets/integrations/logos/logo_mqtt.png"
            title={<Text id="integration.zigbee2mqtt.setup.mqtt" />}
          />
          <ContainerLinkStatus loading={loading || starting} linked={zigbee2mqttConnected} />
          <ContainerStatus
            loading={loading || starting}
            exists={zigbee2mqttStatus.zigbee2mqttExist}
            running={zigbee2mqttStatus.zigbee2mqttRunning}
            imageSrc="/assets/integrations/logos/logo_zigbee2mqtt.png"
            title={<Text id="integration.zigbee2mqtt.setup.zigbee2Mqtt" />}
          />
        </div>
        {zigbee2mqttWaiting && (
          <p class="text-center text-muted mt-3 mb-0" data-cy="z2m-running-status-explanation">
            <Text id={explanationKey} />
          </p>
        )}
      </div>
    </Fragment>
  );
};

export default RunningStatus;
