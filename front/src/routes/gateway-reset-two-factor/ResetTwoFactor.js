import { Text } from 'preact-i18n';
import AuthLayout from '../../components/auth/AuthLayout';
import { RequestStatus } from '../../utils/consts';

const ResetTwoFactor = ({ children, ...props }) => (
  <AuthLayout titleId="gatewayResetTwoFactor.pageTitle">
    <form onSubmit={props.resetTwoFactor} class="card">
      <div class="card-body p-6">
        <div class="card-title">
          <Text id="gatewayResetTwoFactor.formTitle" />
        </div>
        {props.success && (
          <div class="alert alert-success" role="alert">
            <Text id="gatewayResetTwoFactor.success" />
          </div>
        )}
        {(props.tokenMissing || (props.status === RequestStatus.Error && props.error === 'LINK')) && (
          <div class="alert alert-danger" role="alert">
            <Text id="gatewayResetTwoFactor.errorLink" />
          </div>
        )}
        {props.status === RequestStatus.Error && props.error === 'INSTANCE_CONNECTED' && (
          <div class="alert alert-danger" role="alert">
            <Text id="gatewayResetTwoFactor.instanceConnected" />
          </div>
        )}
        {props.status === RequestStatus.Error && props.error === 'UNKNOWN' && (
          <div class="alert alert-danger" role="alert">
            <Text id="gatewayResetTwoFactor.error" />
          </div>
        )}
        {!props.success && !props.tokenMissing && (
          <div>
            <p>
              <Text id="gatewayResetTwoFactor.description" />
            </p>
            <div class="form-footer">
              <button type="submit" class="btn btn-primary btn-block" disabled={props.resetInProgress}>
                <Text id="gatewayResetTwoFactor.button" />
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
    <div class="text-center text-muted">
      <a href="/login">
        <Text id="gatewayResetTwoFactor.loginLink" />
      </a>
    </div>
  </AuthLayout>
);

export default ResetTwoFactor;
