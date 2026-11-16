import { Text, MarkupText, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { RequestStatus, ForgotPasswordStatus } from '../../utils/consts';
import AuthLayout from '../../components/auth/AuthLayout';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import {
  MobileAuthTitle,
  MobileAuthForm,
  MobileAuthBar,
  MobileEmailField,
  MobileTextField
} from '../../components/auth/mobile';
import authStyle from '../../components/auth/style.css';
import { withMobileViewport, MobileNotice, BigButton, kitStyle } from '../../components/mobile';

// The refusals of the two requests, shown above the button on a phone
const REQUEST_ERRORS = {
  [RequestStatus.NetworkError]: 'forgotPassword.networkError',
  [ForgotPasswordStatus.UserNotFound]: 'forgotPassword.userNotFound',
  [RequestStatus.Error]: 'forgotPassword.unknownError',
  [RequestStatus.RateLimitError]: 'forgotPassword.rateLimitError'
};

/**
 * @description The password recovery on a phone (docs/specs/mobile-pages/auth.md, C.2): the
 * e-mail address, then the one-time code — same handlers as the desktop card.
 */
const MobileForgotPasswordPage = props => {
  const codeSent = props.forgotPasswordStatus === RequestStatus.Success;
  const errorId = codeSent ? REQUEST_ERRORS[props.verifyCodeStatus] : REQUEST_ERRORS[props.forgotPasswordStatus];
  return (
    <MobileAuthLayout
      backHref="/login"
      backLabel={<Text id="login.mobile.navBack" />}
      screen={codeSent ? 'code' : 'email'}
      dataCy="forgot-password-mobile"
    >
      <MobileAuthForm onSubmit={codeSent ? props.verifyCode : props.forgotPassword}>
        <MobileAuthTitle>
          <Text id="forgotPassword.cardTitle" />
        </MobileAuthTitle>
        {!codeSent && (
          <MobileEmailField
            id="forgot-password-email"
            label={<Text id="forgotPassword.emailLabel" />}
            placeholder={<Text id="forgotPassword.emailPlaceholder" />}
            value={props.forgotPasswordEmail}
            onInput={props.updateEmail}
            error={
              props.forgotPasswordStatus === ForgotPasswordStatus.WrongEmailError && (
                <Text id="forgotPassword.wrongEmailError" />
              )
            }
            autocomplete="username"
            enterkeyhint="send"
            dataCy="forgot-password-email"
          />
        )}
        {codeSent && (
          <MobileNotice tone="success" icon="check-circle" role="status" data-cy="forgot-password-sent">
            <Text id="forgotPassword.success" />
            <br />
            <br />
            <Text id="forgotPassword.howToAccessLogs" />
          </MobileNotice>
        )}
        {codeSent && (
          <MobileTextField
            id="forgot-password-code"
            label={<Text id="forgotPassword.codeLabel" />}
            placeholder={<Text id="forgotPassword.codePlaceholder" />}
            value={props.forgotPasswordCode}
            onInput={props.updateCode}
            error={
              props.verifyCodeStatus === ForgotPasswordStatus.InvalidCode && <Text id="forgotPassword.codeInvalid" />
            }
            autocomplete="one-time-code"
            autocapitalize="characters"
            autocorrect="off"
            spellcheck={false}
            enterkeyhint="go"
            dataCy="forgot-password-code"
          />
        )}
        {codeSent && (
          <div class={authStyle.mobileLinks}>
            <button
              type="button"
              class={authStyle.mobileLink}
              onClick={props.forgotPassword}
              data-cy="forgot-password-send-again"
            >
              <Text id="forgotPassword.sendCodeAgain" />
            </button>
          </div>
        )}
        <div class={kitStyle.footnote}>
          <MarkupText id="global.needHelpText" />
        </div>
        <MobileAuthBar error={errorId && <Text id={errorId} />}>
          {!codeSent && (
            <BigButton
              variant="primary"
              type="submit"
              loading={props.forgotPasswordStatus === RequestStatus.Getting}
              data-cy="forgot-password-submit"
            >
              <Text id="forgotPassword.button" />
            </BigButton>
          )}
          {codeSent && (
            <BigButton
              variant="primary"
              type="submit"
              loading={props.verifyCodeStatus === RequestStatus.Getting}
              data-cy="forgot-password-code-submit"
            >
              <Text id="forgotPassword.codeButton" />
            </BigButton>
          )}
        </MobileAuthBar>
      </MobileAuthForm>
    </MobileAuthLayout>
  );
};

const DesktopForgotPasswordPage = ({ children, ...props }) => {
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

const ForgotPasswordPage = ({ isMobile, ...props }) =>
  isMobile ? <MobileForgotPasswordPage {...props} /> : <DesktopForgotPasswordPage {...props} />;

export default withMobileViewport(ForgotPasswordPage);
