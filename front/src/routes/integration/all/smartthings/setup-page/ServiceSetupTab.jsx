import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

const ServiceSetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.smartthings.setup.service.title" />
        </h3>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.appDetailsSmartthingsStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.appDetailsSmartthingsStatus === RequestStatus.Error && (
              <p class="alert alert-danger">
                <Text id="integration.smartthings.setup.service.error" />
              </p>
            )}
            {props.appDetailsSmartthingsStatus === RequestStatus.Success && (
              <p class="alert alert-info">
                <Text id="integration.smartthings.setup.service.saved" />
              </p>
            )}
            <form>
              <div class="form-group">
                <label for="smartthingsClientId" class="form-label">
                  <Text id={`integration.smartthings.setup.service.clientId`} />
                </label>
                <Localizer>
                  <input
                    name="smartthingsClientId"
                    placeholder={<Text id="integration.smartthings.setup.service.clientId" />}
                    value={props.smartthingsGladysClientId}
                    class="form-control"
                    disabled={true}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="smartthingsClientSecret" class="form-label">
                  <Text id={`integration.smartthings.setup.service.clientSecret`} />
                </label>
                <Localizer>
                  <input
                    name="smartthingsClientSecret"
                    placeholder={<Text id="integration.smartthings.setup.service.clientSecret" />}
                    value={props.smartthingsGladysClientSecret}
                    class="form-control"
                    disabled={true}
                  />
                </Localizer>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSetupTab;
