import { Text, MarkupText, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import config from '../../../../config';
import MCPApiKey from './MCPApiKeys';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const MCPWelcomePage = ({ user, ...props }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.mcp.title" />}
    tabs={
      <DeviceConfigurationLink user={user} configurationKey="integrations" documentKey="mcp" linkClass="hz-tab-link">
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.mcp.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <div class="card">
      <div class="card-body">
        <MarkupText id="integration.mcp.longDescription" />
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.mcp.urlLabel" />
          </label>
          <input
            type="text"
            class="form-control"
            value={`${config.localApiUrl}/api/v1/service/mcp/proxy`}
            disabled={true}
          />
          <small class="form-text text-muted">
            <Text id="integration.mcp.urlInstruction" />
          </small>
        </div>
        <div class="table-responsive">
          <label class="form-label">
            <Text id="integration.mcp.apiKeyLabel" />
          </label>
          <Text id="integration.mcp.apiKeyInstruction" />
          <div class="alert alert-info mt-2">
            <Text id="integration.mcp.apiKeyDifference" />
          </div>
          <small class="form-text text-muted">
            <Text id="integration.mcp.warningKeyDisappear" />
          </small>
          <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
            <thead>
              <tr>
                <th>
                  <Text id="integration.mcp.keyName" />
                </th>
                <th class="w-1">
                  <Text id="integration.mcp.revoke" />
                </th>
              </tr>
            </thead>
            <tbody>
              {props.mcpApiKeys &&
                props.mcpApiKeys.map((apiKey, index) => (
                  <MCPApiKey user={props.user} apiKey={apiKey} revokeMCPApiKey={props.revokeMCPApiKey} index={index} />
                ))}

              <tr>
                <td>
                  <Localizer>
                    <input
                      type="text"
                      class={cx('form-control', { 'is-invalid': props.missingNewMCPClient })}
                      value={props.newMCPClient}
                      onChange={props.updateNewMCPClient}
                      placeholder={<Text id="integration.mcp.namePlaceholder" />}
                    />
                  </Localizer>
                </td>
                <td>
                  <button class="btn btn-primary" onClick={props.createMCPApiKey}>
                    <Text id="integration.mcp.generateButton" />
                  </button>
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default connect('user', {})(MCPWelcomePage);
