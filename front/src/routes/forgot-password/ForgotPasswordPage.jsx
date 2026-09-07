import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { RequestStatus, ForgotPasswordStatus } from '../../utils/consts';
import AuthLayout from '../../components/auth/AuthLayout';

const ForgotPasswordPage = ({ children, ...props }) => (
  <AuthLayout titleId="forgotPassword.title">
    <form onSubmit={props.forgotPassword} class="card">
      <div class="card-body p-6">
        <div
          class={cx('dimmer', {
            active: props.forgotPasswordStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-title">
              <Text id="forgotPassword.cardTitle" />
            </div>

            {props.forgotPasswordStatus === RequestStatus.Success && (
              <div class="alert alert-success" role="alert">
                <Text id="forgotPassword.success" />
                <br />
                <br />
                <Text id="forgotPassword.howToAccessLogs" />
              </div>
            )}

            {props.forgotPasswordStatus === RequestStatus.NetworkError && (
              <div class="alert alert-danger" role="alert">
                <Text id="forgotPassword.networkError" />
              </div>
            )}

            {props.forgotPasswordStatus === ForgotPasswordStatus.UserNotFound && (
              <div class="alert alert-danger" role="alert">
                <Text id="forgotPassword.userNotFound" />
              </div>
            )}

            {props.forgotPasswordStatus === RequestStatus.Error && (
              <div class="alert alert-danger" role="alert">
                <Text id="forgotPassword.unknownError" />
              </div>
            )}

            {props.forgotPasswordStatus === RequestStatus.RateLimitError && (
              <div class="alert alert-danger" role="alert">
                <Text id="forgotPassword.rateLimitError" />
              </div>
            )}

            {props.forgotPasswordStatus !== RequestStatus.Success && (
              <div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="forgotPassword.emailLabel" />
                    <Link href="/login" class="float-right small">
                      <Text id="forgotPassword.backToLogin" />
                    </Link>
                  </label>
                  <Localizer>
                    <input
                      type="email"
                      class={cx('form-control', {
                        'is-invalid': props.forgotPasswordStatus === ForgotPasswordStatus.WrongEmailError
                      })}
                      placeholder={<Text id="forgotPassword.emailPlaceholder" />}
                      value={props.forgotPasswordEmail}
                      onInput={props.updateEmail}
                    />
                  </Localizer>
                  <div class="invalid-feedback">
                    {' '}
                    <Text id="forgotPassword.wrongEmailError" />
                  </div>
                </div>
                <div class="form-footer">
                  <button
                    onClick={props.forgotPassword}
                    class="btn btn-primary btn-block"
                    disabled={props.forgotPasswordStatus === RequestStatus.Getting}
                  >
                    <Text id="forgotPassword.button" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
    <div class="text-center text-muted">
      <MarkupText id="global.needHelpText" />
    </div>
  </AuthLayout>
);

export default ForgotPasswordPage;
