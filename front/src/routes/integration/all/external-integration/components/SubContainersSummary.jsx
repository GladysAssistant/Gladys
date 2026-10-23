import { Text } from 'preact-i18n';

import { getLocalizedText } from '../utils';

// Install screen summary of the `containers` authorization contract: the
// user sees everything that will run (images, limits — memory, CPU, tasks,
// /tmp size) and everything that will be exposed on the LAN (published
// ports) before approving.
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
                <br />
                <small class="text-muted">
                  <Text
                    id="integration.externalIntegration.subContainers.pidsLimitValue"
                    fields={{ count: container.pids_limit || 100 }}
                  />{' '}
                  /{' '}
                  <Text
                    id="integration.externalIntegration.subContainers.tmpSizeValue"
                    fields={{ size: container.tmp_mb || 64 }}
                  />
                </small>
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
