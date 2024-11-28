import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const FreeMobilePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.free-mobile.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <DeviceConfigurationLink
                    user={props.user}
                    configurationKey="integrations"
                    documentKey="free-mobile"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.free-mobile.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.free-mobile.title" />
                  </h1>
                </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FreeMobilePage;
