import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { RequestStatus, ForgotPasswordStatus } from '../../utils/consts';

const ForgotPasswordPage = ({ children, ...props }) => (
  <div class="container">
    <div class="row">
      <div class="col col-login mx-auto mt-5 pt-5">
        <div class="text-center mb-6 pt-5">
          <h2>
            <Localizer>
              <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt={<Text id="global.logoAlt" />} />
            </Localizer>
            <Text id="forgotPassword.title" />
          </h2>
        </div>

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
      </div>
    </div>
  </div>
);

export default ForgotPasswordPage;
