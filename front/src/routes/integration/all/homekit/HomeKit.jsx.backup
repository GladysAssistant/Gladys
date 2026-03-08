import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import { USER_ROLE } from '../../../../../../server/utils/constants';
import cx from 'classnames';
import style from './style.css';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const HomKitPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.homekit.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <DeviceConfigurationLink
                    user={props.user}
                    configurationKey="integrations"
                    documentKey="homekit"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.homekit.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.homekit.title" />
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
                      {props.user && props.user.role === USER_ROLE.ADMIN && (
                        <p>
                          <MarkupText id="integration.homekit.introduction" />
                        </p>
                      )}
                      {props.homekitReloadStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.homekit.configurationError" />
                        </div>
                      )}
                      {props.homekitResetStatus === RequestStatus.Error && (
                        <div class="alert alert-danger">
                          <Text id="integration.homekit.resetError" />
                        </div>
                      )}
                      {props.user && props.user.role === USER_ROLE.ADMIN && (
                        <div class="form-group">
                          <Text id={`integration.homekit.qrCode`} />
                          {props.homekitSetupDataUrl && (
                            <img class="mx-auto d-block mb-3" src={props.homekitSetupDataUrl} />
                          )}
                          <p className={style.buttonDescription}>
                            <Text id={`integration.homekit.reload`} />
                          </p>
                          <button class="btn btn-primary" onClick={props.refreshBridge}>
                            <Text id={`integration.homekit.reloadButton`} />
                          </button>
                          <p className={style.buttonDescription}>
                            <MarkupText id={`integration.homekit.reset`} />
                          </p>
                          <button class="btn btn-danger" onClick={props.resetBridge}>
                            <Text id={`integration.homekit.resetButton`} />
                          </button>
                        </div>
                      )}
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

export default HomKitPage;
