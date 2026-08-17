import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

import { DeviceStamp, DeviceUsage, FeatureIcons, IntegrationName } from './helpers';

const DeviceRow = ({ device, integration, usage, usageLoaded }) => (
  <tr>
    <td class="w-1">
      <DeviceStamp device={device} integration={integration} />
    </td>
    <td>
      <div>{device.name}</div>
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
    <td>
      <DeviceUsage usage={usage} loaded={usageLoaded} />
    </td>
    <td class="text-right text-nowrap">
      {integration && integration.deviceUrl && (
        <Link href={integration.deviceUrl} class="btn btn-sm btn-outline-primary">
          <i class="fe fe-external-link mr-1" />
          <Text id="devicesList.openInIntegration" />
        </Link>
      )}
    </td>
  </tr>
);

export default DeviceRow;
