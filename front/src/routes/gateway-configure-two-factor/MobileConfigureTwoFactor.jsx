import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';

import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthTitle, MobileAuthForm, MobileAuthBar, MobileCodeField } from '../../components/auth/mobile';
import authStyle from '../../components/auth/style.css';
import TwoFactorAppList from '../../components/gateway/TwoFactorAppList';
import {
  MobileField,
  MobileSteps,
  MobileSectionHeader,
  MobileToast,
  BigButton,
  fieldClass,
  kitStyle
} from '../../components/mobile';
import style from './style.css';

/**
 * @description Setting up two-factor authentication on a phone
 * (docs/specs/mobile-pages/auth.md, D.3). The two-factor app is on the phone the page is opened
 * on: a QR code cannot be scanned by the screen that shows it, so the first way to add the
 * account is the link that opens the app (`otpauth://`), then the secret to paste; the QR code
 * stays for an app that lives on another device. Same container as the desktop card: the same
 * secret, the same request.
 */
class MobileConfigureTwoFactor extends Component {
  state = {
    copied: false
  };

  copySecret = async () => {
    const copied = await this.props.copySecret();
    if (copied) {
      this.setState({ copied: true });
    }
  };

  closeToast = () => this.setState({ copied: false });

  renderIntro() {
    return (
      <div data-cy="configure-two-factor-intro">
        <MobileAuthTitle lead={<Text id="gatewayTwoFactorAuth.securityIsImportant" />}>
          <Text id="gatewayTwoFactorAuth.configureTitle" />
        </MobileAuthTitle>
        <p class={kitStyle.lead}>
          <Text id="gatewayTwoFactorAuth.securityApps" />
        </p>
        <TwoFactorAppList mobile />
        <MobileAuthBar>
          <BigButton variant="primary" onClick={this.props.nextStep} data-cy="configure-two-factor-next">
            <Text id="gatewayTwoFactorAuth.configureButton" />
          </BigButton>
        </MobileAuthBar>
      </div>
    );
  }

  renderSetup() {
    const props = this.props;
    return (
      <MobileAuthForm onSubmit={props.enableTwoFactor} dataCy="configure-two-factor-setup">
        <MobileAuthTitle>
          <Text id="gatewayTwoFactorAuth.configureTitle" />
        </MobileAuthTitle>

        <MobileSectionHeader title={<Text id="gatewayTwoFactorAuth.mobile.addAccountTitle" />} />
        {props.otpauthUrl && (
          <div class={kitStyle.buttons}>
            <BigButton icon="smartphone" href={props.otpauthUrl} data-cy="configure-two-factor-open-app">
              <Text id="gatewayTwoFactorAuth.mobile.openApp" />
            </BigButton>
          </div>
        )}
        <p class={kitStyle.footnote}>
          <Text id="gatewayTwoFactorAuth.mobile.openAppHelp" />
        </p>

        <MobileSectionHeader title={<Text id="gatewayTwoFactorAuth.mobile.manualTitle" />} />
        <div class={authStyle.mobileCard}>
          <ol class={authStyle.mobileStepList}>
            <li>
              <span>
                <Text id="gatewayTwoFactorAuth.app.open" />
              </span>
            </li>
            <li>
              <span>
                <Text id="gatewayTwoFactorAuth.app.addAccount" />
              </span>
            </li>
            <li>
              <span>
                <Text id="gatewayTwoFactorAuth.app.scanQRCode" />
              </span>
            </li>
          </ol>
        </div>
        <MobileField label={<Text id="gatewayTwoFactorAuth.secretLabel" />} htmlFor="configure-two-factor-secret">
          <div class={fieldClass.group}>
            <input
              id="configure-two-factor-secret"
              type="text"
              class={`${fieldClass.input} ${style.mobileSecret}`}
              value={props.secret || ''}
              // read and copied, never typed: no keyboard opens on it
              readonly
              data-cy="configure-two-factor-secret"
            />
            <button
              type="button"
              class={`${fieldClass.addon} ${style.mobileCopy}`}
              onClick={this.copySecret}
              disabled={!props.secret}
              data-cy="configure-two-factor-copy"
            >
              <Text id="gatewayTwoFactorAuth.copy" />
            </button>
          </div>
        </MobileField>
        {props.dataUrl && (
          <div class={`${authStyle.mobileCard} ${style.mobileQrCode}`}>
            <Localizer>
              <img
                src={props.dataUrl}
                alt={<Text id="gatewayTwoFactorAuth.mobile.qrCodeAlt" />}
                data-cy="configure-two-factor-qr-code"
              />
            </Localizer>
            <p>
              <Text id="gatewayTwoFactorAuth.mobile.qrCodeHelp" />
            </p>
          </div>
        )}

        <MobileSectionHeader title={<Text id="gatewayTwoFactorAuth.confirmCode" />} />
        <MobileCodeField
          id="configure-two-factor-code"
          placeholder={<Text id="gatewayTwoFactorAuth.enterCode" />}
          value={props.twoFactorCode}
          onInput={props.updateTwoFactorCode}
          error={props.errored && <Text id="gatewayTwoFactorAuth.invalidCode" />}
          maxlength="7"
          enterkeyhint="go"
          aria-label={<Text id="gatewayTwoFactorAuth.confirmCode" />}
          dataCy="configure-two-factor-code"
        />
        <MobileAuthBar>
          <BigButton variant="primary" type="submit" data-cy="configure-two-factor-enable">
            <Text id="gatewayTwoFactorAuth.enable" />
          </BigButton>
        </MobileAuthBar>
        <Localizer>
          <MobileToast
            message={this.state.copied ? <Text id="gatewayRecoveryCodes.copiedButton" /> : null}
            onClose={this.closeToast}
            aboveBar
          />
        </Localizer>
      </MobileAuthForm>
    );
  }

  render({ step, previousStep }) {
    return (
      <MobileAuthLayout
        titleId="gatewayTwoFactorAuth.title"
        onBack={step === 2 ? previousStep : null}
        screen={step}
        dataCy="configure-two-factor-mobile"
      >
        <MobileSteps current={step} total={2} />
        {step === 1 && this.renderIntro()}
        {step === 2 && this.renderSetup()}
      </MobileAuthLayout>
    );
  }
}

export default MobileConfigureTwoFactor;
