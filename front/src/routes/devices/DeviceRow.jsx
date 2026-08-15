import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

import { DeviceStamp, FeatureIcons, IntegrationName } from './helpers';

const DeviceRow = ({ device, integration }) => (
  <tr>
    <td class="w-1">
      <DeviceStamp device={device} integration={integration} />
    </td>
    <td>
      {/* the device name opens the most specific page this device has in its
          integration, while the integration column links to the integration */}
      <div>
        {integration && integration.deviceUrl ? <Link href={integration.deviceUrl}>{device.name}</Link> : device.name}
      </div>
      <div class="small text-muted">{device.selector}</div>
    </td>
    <td class="text-nowrap">
      {device.room ? (
        <span class="tag">{device.room.name}</span>
      ) : (
        <span class="text-muted small">
          <Text id="devicesList.noRoom" />
        </span>
      )}
    </td>
    <td>
      <IntegrationName integration={integration} />
    </td>
    <td>
      <FeatureIcons device={device} />
    </td>
  </tr>
);

export default DeviceRow;
