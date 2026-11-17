import { Text, MarkupText } from 'preact-i18n';

import { RequestStatus } from '../../utils/consts';
import { MobileSectionHeader, MobileGroup, MobileRow, kitStyle } from '../mobile';

/**
 * @description "Lost access to your two-factor app?" on a phone
 * (docs/specs/mobile-pages/auth.md, D.1): the ways out of a two-factor step, as rows — a
 * recovery code instead of the code of the app (and back), and the reset by e-mail when the
 * caller offers it (`onRequestReset`), until its e-mail is sent.
 *
 * help: the link to the troubleshooting guide, under the rows.
 */
const MobileLostTwoFactor = ({
  useRecoveryCode,
  onUseRecoveryCode,
  onUseTwoFactorCode,
  onRequestReset,
  resetStatus,
  help
}) => (
  <div data-cy="lost-two-factor">
    <MobileSectionHeader title={<Text id="gatewayLogin.lostTwoFactor" />} />
    <MobileGroup>
      {!useRecoveryCode && (
        <MobileRow
          icon="key"
          title={<Text id="gatewayLogin.useRecoveryCodeLink" />}
          onClick={onUseRecoveryCode}
          dataCy="lost-two-factor-use-recovery-code"
        />
      )}
      {useRecoveryCode && (
        <MobileRow
          icon="smartphone"
          title={<Text id="gatewayLogin.useTwoFactorCodeLink" />}
          onClick={onUseTwoFactorCode}
          dataCy="lost-two-factor-use-app-code"
        />
      )}
      {onRequestReset && resetStatus !== RequestStatus.Success && (
        <MobileRow
          icon="mail"
          iconTone="neutral"
          title={<Text id="gatewayLogin.mobile.resetTwoFactorTitle" />}
          subtitle={<Text id="gatewayLogin.resetTwoFactorLink" />}
          onClick={onRequestReset}
          disabled={resetStatus === RequestStatus.Getting}
          dataCy="lost-two-factor-reset"
        />
      )}
    </MobileGroup>
    <div class={kitStyle.footnote}>
      <MarkupText id="gatewayLogin.noRecoveryCode" />
    </div>
    {help && (
      <div class={kitStyle.footnote}>
        <MarkupText id="gatewayLogin.twoFactorHelp" />
      </div>
    )}
  </div>
);

export default MobileLostTwoFactor;
