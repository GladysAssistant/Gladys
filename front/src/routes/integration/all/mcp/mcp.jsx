import { Text, MarkupText, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import config from '../../../../config';
import MCPApiKey from './MCPApiKeys';

const MCPWelcomePage = ({ user, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.mcp.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <DeviceConfigurationLink
                    user={user}
                    configurationKey="integrations"
                    documentKey="mcp"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.mcp.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.mcp.title" />
                  </h1>
                </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default connect('user', {})(MCPWelcomePage);
