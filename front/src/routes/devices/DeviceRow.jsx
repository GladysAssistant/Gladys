import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';

import { DeviceStamp, FeatureIcons, IntegrationName } from './helpers';

const DeviceRow = ({ device, integration }) => (
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
    <td class="text-right text-nowrap">
      <Localizer>
        <Link
          href={`/dashboard/devices/${device.selector}/history`}
          class="btn btn-sm btn-outline-secondary mr-1"
          title={<Text id="devicesList.editHistory" />}
        >
          <i class="fe fe-list" />
        </Link>
      </Localizer>
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
