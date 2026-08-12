import { Text } from 'preact-i18n';

import { getLocalizedText } from '../utils';

// Install screen summary of the `containers` authorization contract: the
// user sees everything that will run (images, limits) and everything that
// will be exposed on the LAN (published ports) before approving.
const SubContainersSummary = ({ containers, language }) => (
  <div class="mb-4">
    <h4>
      <Text id="integration.externalIntegration.subContainers.title" />
    </h4>
    <p class="text-muted small">
      <Text id="integration.externalIntegration.subContainers.description" />
    </p>
    <div class="table-responsive">
      <table class="table table-sm card-table">
        <thead>
          <tr>
            <th>
              <Text id="integration.externalIntegration.subContainers.nameLabel" />
            </th>
            <th>
              <Text id="integration.externalIntegration.subContainers.imageLabel" />
            </th>
            <th>
              <Text id="integration.externalIntegration.subContainers.limitsLabel" />
            </th>
            <th>
              <Text id="integration.externalIntegration.subContainers.portsLabel" />
            </th>
          </tr>
        </thead>
        <tbody>
          {containers.map(container => (
            <tr>
              <td>{container.name}</td>
              <td>
                <code>{container.docker_image}</code>
              </td>
              <td>
                {container.memory_mb || 256}&nbsp;MB / {container.cpu || 0.5}&nbsp;CPU
              </td>
              <td>
                {(container.ports || []).length === 0 ? (
                  <span class="text-muted">—</span>
                ) : (
                  (container.ports || []).map(port => (
                    <span class="badge badge-warning mr-1">
                      {getLocalizedText(port.label, language) || port.container_port}
                    </span>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default SubContainersSummary;
