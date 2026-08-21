import { Text } from 'preact-i18n';
import cx from 'classnames';
import SettingsLayout from '../SettingsLayout';
import GatewayRecoveryCodes from '../../../components/gateway/GatewayRecoveryCodes';
import { RequestStatus } from '../../../utils/consts';

const SecurityPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="row">
      <div class="col-md-6 offset-md-3">
        {props.recoveryCodes ? (
          <GatewayRecoveryCodes recoveryCodes={props.recoveryCodes} status={props.status} />
        ) : (
          <div class="card">
            <div class="card-body p-6">
              <div class={cx('dimmer', { active: props.status === RequestStatus.Getting })}>
                <div class="loader" />
                <div class="dimmer-content">
                  <div class="card-title">
                    <Text id="gatewayRecoveryCodes.cardTitle" />
                  </div>
                  <p>
                    <Text id="gatewayRecoveryCodes.description" />
                  </p>
                  {props.status === RequestStatus.Error && (
                    <div class="alert alert-danger" role="alert">
                      <Text id="gatewayRecoveryCodes.generationError" />
                    </div>
                  )}
                  {props.confirming ? (
                    <div>
                      {/* the Gateway replaces the whole set on every call, so someone who
                          already saved a set would silently lose it without this warning */}
                      <div class="alert alert-warning" role="alert">
                        <Text id="gatewayRecoveryCodes.rotationWarning" />
                      </div>
                      <div class="btn-list">
                        <button type="button" class="btn btn-primary" onClick={props.generateRecoveryCodes}>
                          <Text id="gatewayRecoveryCodes.confirmGenerateButton" />
                        </button>
                        <button type="button" class="btn btn-secondary" onClick={props.cancelGenerate}>
                          <Text id="global.cancel" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" class="btn btn-primary" onClick={props.askConfirmation}>
                      <Text id="gatewayRecoveryCodes.generateButton" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </SettingsLayout>
);

export default SecurityPage;
