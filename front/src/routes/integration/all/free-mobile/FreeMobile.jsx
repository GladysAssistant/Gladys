import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const FreeMobilePage = ({ children, ...props }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.free-mobile.title" />}
    tabs={
      <DeviceConfigurationLink
        user={props.user}
        configurationKey="integrations"
        documentKey="free-mobile"
        linkClass="hz-tab-link"
      >
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.free-mobile.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <div class="alert alert-warning mb-4">
      <h4 class="alert-title">
        <Text id="integration.free-mobile.deprecatedWarning.title" />
      </h4>
      <MarkupText id="integration.free-mobile.deprecatedWarning.description" />
    </div>
    <div class="card">
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.loading
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <MarkupText id="integration.free-mobile.introduction" />
            </p>
            {props.freeMobileSaveSettingsStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.free-mobile.configurationError" />
              </div>
            )}
            {props.freeMobileSaveSettingsStatus === RequestStatus.Success && (
              <div class="alert alert-info">
                <Text id="integration.free-mobile.configurationSuccess" />
              </div>
            )}
            <form onSubmit={props.saveFreeMobileSettings}>
              <div class="form-group">
                <div class="form-label">
                  <Text id={`integration.free-mobile.username`} />
                </div>
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={<Text id="integration.free-mobile.username" />}
                    onInput={props.updateFreeMobileUsername}
                    value={props.freeMobileUsername}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <div class="form-label">
                  <Text id={`integration.free-mobile.key`} />
                </div>
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={<Text id="integration.free-mobile.key" />}
                    onInput={props.updateFreeMobileAccessToken}
                    value={props.freeMobileAccessToken}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <span class="input-group-append">
                  <button type="submit" class="btn btn-primary">
                    <Text id={`integration.free-mobile.saveButton`} />
                  </button>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default FreeMobilePage;
