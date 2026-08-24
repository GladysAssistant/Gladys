import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';

const ResetPassworFrom = ({ children, ...props }) => (
  <form onSubmit={props.resetPassword} className="card">
    <div className="card-body p-6">
      <div className="card-title">
        <Text id="gatewayResetPassword.formTitle" />
      </div>
      {props.browserCompatible === false && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewayResetPassword.incompatibleBrowserLabel" />
        </div>
      )}
      {props.errorLink && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewayResetPassword.errorLinkLabel" />
        </div>
      )}
      {props.invalidRecoveryCode && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewayResetPassword.invalidRecoveryCodeLabel" />
        </div>
      )}
      {props.passwordNotMatching && (
        <div class="alert alert-warning" role="alert">
          <Text id="gatewayResetPassword.passwordNotMatchingLabel" />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">
          <Text id="gatewayResetPassword.passwordLabel" />
        </label>
        <Localizer>
          <input
            type="password"
            className={cx('form-control', { 'is-invalid': props.passwordError })}
            placeholder={<Text id="gatewayResetPassword.passwordPlaceholder" />}
            value={props.password}
            onInput={props.updatePassword}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="gatewayResetPassword.passwordInvalid" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">
          <Text id="gatewayResetPassword.repeatPasswordLabel" />
        </label>
        <Localizer>
          <input
            type="password"
            className={cx('form-control', { 'is-invalid': props.passwordError })}
            placeholder={<Text id="gatewayResetPassword.passwordPlaceholder" />}
            value={props.passwordRepeat}
            onInput={props.updatePasswordRepeat}
          />
        </Localizer>
        <div class="invalid-feedback">
          <Text id="gatewayResetPassword.passwordInvalid" />
        </div>
      </div>
      {props.twoFactorEnabled && !props.useRecoveryCode && (
        <div className="form-group">
          <label className="form-label">
            <Text id="gatewayResetPassword.twoFactorCodeLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="gatewayResetPassword.twoFactorCodePlaceholder" />}
              value={props.twoFactorCode}
              onInput={props.updateTwoFactorCode}
            />
          </Localizer>
          <p class="text-muted small mt-2 mb-0">
            <Text id="gatewayResetPassword.lostTwoFactor" />{' '}
            <a href="#" onClick={props.showRecoveryCode}>
              <Text id="gatewayResetPassword.useRecoveryCodeLink" />
            </a>
            <br />
            <MarkupText id="gatewayLogin.noRecoveryCode" />
          </p>
        </div>
      )}
      {props.twoFactorEnabled && props.useRecoveryCode && (
        <div className="form-group">
          <label className="form-label" htmlFor="reset-password-recovery-code">
            <Text id="gatewayResetPassword.recoveryCodeLabel" />
          </label>
          <Localizer>
            <input
              id="reset-password-recovery-code"
              type="text"
              class="form-control"
              placeholder={<Text id="gatewayResetPassword.recoveryCodePlaceholder" />}
              value={props.twoFactorRecoveryCode}
              onInput={props.updateTwoFactorRecoveryCode}
              autocomplete="off"
            />
          </Localizer>
          <p class="text-muted small mt-2 mb-0">
            <a href="#" onClick={props.showTwoFactorCode}>
              <Text id="gatewayResetPassword.useTwoFactorCodeLink" />
            </a>
            <br />
            <MarkupText id="gatewayLogin.noRecoveryCode" />
          </p>
        </div>
      )}
      <div className="form-footer">
        <button type="submit" className="btn btn-primary btn-block" disabled={props.resetInProgress}>
          <Text id="gatewayResetPassword.resetPasswordButton" />
        </button>
      </div>
    </div>
  </form>
);

export default ResetPassworFrom;
