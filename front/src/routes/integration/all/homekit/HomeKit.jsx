import { Text, MarkupText } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import { USER_ROLE } from '../../../../../../server/utils/constants';
import cx from 'classnames';

import style from './style.css';

const HomKitPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.loading
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      <h2>
                        <Text id="integration.homekit.title" />
                      </h2>
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
