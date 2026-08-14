import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const IntegrationName = ({ integration }) => {
  if (!integration) {
    return <span class="text-muted">-</span>;
  }
  const name = integration.i18nKey ? <Text id={integration.i18nKey}>{integration.name}</Text> : integration.name;
  if (!integration.url) {
    return <span>{name}</span>;
  }
  return <Link href={integration.url}>{name}</Link>;
};

const DeviceRow = ({ device, integration }) => (
  <tr>
    <td>
      <div>{device.name}</div>
      <div class="small text-muted">{device.selector}</div>
    </td>
    <td>
      {device.room ? (
        device.room.name
      ) : (
        <span class="text-muted">
          <Text id="devicesList.noRoom" />
        </span>
      )}
    </td>
    <td>
      <IntegrationName integration={integration} />
    </td>
    <td class="text-center">{device.features ? device.features.length : 0}</td>
    <td class="text-right">
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
