import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { RequestStatus, ForgotPasswordStatus } from '../../utils/consts';
import AuthLayout from '../../components/auth/AuthLayout';

const ForgotPasswordPage = ({ children, ...props }) => {
  const codeSent = props.forgotPasswordStatus === RequestStatus.Success;
  return (
    <AuthLayout titleId="forgotPassword.title">
      <form onSubmit={codeSent ? props.verifyCode : props.forgotPassword} class="card">
        <div class="card-body p-6">
          <div
            class={cx('dimmer', {
              active:
                props.forgotPasswordStatus === RequestStatus.Getting || props.verifyCodeStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-title">
                <Text id="forgotPassword.cardTitle" />
              </div>

              {codeSent && (
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
                      type="submit"
                      class="btn btn-primary btn-block"
                      disabled={props.forgotPasswordStatus === RequestStatus.Getting}
                    >
                      <Text id="forgotPassword.button" />
                    </button>
                  </div>
                </div>
              )}

              {codeSent && (
                <div>
                  {props.verifyCodeStatus === RequestStatus.NetworkError && (
                    <div class="alert alert-danger" role="alert">
                      <Text id="forgotPassword.networkError" />
                    </div>
                  )}

                  {props.verifyCodeStatus === RequestStatus.Error && (
                    <div class="alert alert-danger" role="alert">
                      <Text id="forgotPassword.unknownError" />
                    </div>
                  )}

                  {props.verifyCodeStatus === RequestStatus.RateLimitError && (
                    <div class="alert alert-danger" role="alert">
                      <Text id="forgotPassword.rateLimitError" />
                    </div>
                  )}

                  <div class="form-group">
                    <label class="form-label">
                      <Text id="forgotPassword.codeLabel" />
                      <Link href="/login" class="float-right small">
                        <Text id="forgotPassword.backToLogin" />
                      </Link>
                    </label>
                    <Localizer>
                      <input
                        type="text"
                        autoComplete="one-time-code"
                        autoCapitalize="characters"
                        spellCheck={false}
                        class={cx('form-control', {
                          'is-invalid': props.verifyCodeStatus === ForgotPasswordStatus.InvalidCode
                        })}
                        placeholder={<Text id="forgotPassword.codePlaceholder" />}
                        value={props.forgotPasswordCode}
                        onInput={props.updateCode}
                      />
                    </Localizer>
                    <div class="invalid-feedback">
                      {' '}
                      <Text id="forgotPassword.codeInvalid" />
                    </div>
                  </div>
                  <div class="form-footer">
                    <button
                      type="submit"
                      class="btn btn-primary btn-block"
                      disabled={props.verifyCodeStatus === RequestStatus.Getting}
                    >
                      <Text id="forgotPassword.codeButton" />
                    </button>
                  </div>
                  <div class="text-center mt-3">
                    <button type="button" class="btn btn-link btn-sm" onClick={props.forgotPassword}>
                      <Text id="forgotPassword.sendCodeAgain" />
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
};

export default ForgotPasswordPage;
