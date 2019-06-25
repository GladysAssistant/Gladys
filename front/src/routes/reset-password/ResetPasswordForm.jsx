import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { Link } from 'preact-router/match';
import { RequestStatus, ResetPasswordStatus } from '../../utils/consts';

const ResetPasswordForm = ({ children, ...props }) => (
  <div>
    <form onSubmit={props.resetPassword} class="card">
      <div
        class={cx('dimmer', {
          active: props.resetPasswordStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card-body p-6">
            <div class="card-title">
              <Text id="resetPassword.cardTitle" />
            </div>

            {props.resetPasswordStatus === RequestStatus.NetworkError && (
              <div class="alert alert-danger" role="alert">
                <Text id="httpErrors.networkError" />
              </div>
            )}

            {props.resetPasswordStatus === ResetPasswordStatus.ResetTokenNotFound && (
              <div class="alert alert-danger" role="alert">
                <Text id="resetPassword.resetTokenNotFound" />
              </div>
            )}

            {props.resetPasswordStatus === RequestStatus.Error && (
              <div class="alert alert-danger" role="alert">
                <Text id="httpErrors.unknownError" />
              </div>
            )}

            {props.resetPasswordStatus === RequestStatus.RateLimitError && (
              <div class="alert alert-danger" role="alert">
                <Text id="httpErrors.rateLimitError" />
              </div>
            )}

            {props.errored && (
              <div>
                <Link class="btn btn-block btn-primary" href="/forgot-password">
                  <Text id="resetPassword.generateLinkAgain" />
                </Link>
              </div>
            )}

            {!props.errored && (
              <div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="resetPassword.passwordLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="password"
                      class={cx('form-control', {
                        'is-invalid': get(props, 'resetPasswordErrors.password')
                      })}
                      placeholder={<Text id="resetPassword.passwordPlaceholder" />}
                      value={props.resetPasswordPassword}
                      onInput={props.updatePassword}
                    />
                  </Localizer>
                  <div class="invalid-feedback">
                    {' '}
                    <Text id="resetPassword.passwordTooShort" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="resetPassword.passwordRepeatLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="password"
                      class={cx('form-control', {
                        'is-invalid': get(props, 'resetPasswordErrors.passwordRepeat')
                      })}
                      placeholder={<Text id="resetPassword.passwordRepeatPlaceholder" />}
                      value={props.resetPasswordPasswordRepeat}
                      onInput={props.updatePasswordRepeat}
                    />
                  </Localizer>
                  <div class="invalid-feedback">
                    {' '}
                    <Text id="resetPassword.passwordRepeatError" />
                  </div>
                </div>
                <div class="form-footer">
                  <button
                    onClick={props.resetPassword}
                    class="btn btn-primary btn-block"
                    disabled={props.resetPasswordStatus === RequestStatus.Getting}
                  >
                    <Text id="resetPassword.button" />
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
  </div>
);

export default ResetPasswordForm;
