import { Text, MarkupText } from 'preact-i18n';

import { RequestStatus } from '../../utils/consts';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthTitle, MobileAuthBar } from '../../components/auth/mobile';
import authStyle from '../../components/auth/style.css';
import {
  MobileField,
  MobileNotice,
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  BigButton,
  fieldClass,
  kitStyle
} from '../../components/mobile';
import style from './style.css';

const NOT_ACCEPTED_LOCALLY_TEXTS = {
  KEYS_CHANGED: { title: 'keysChangedTitle', intro: 'keysChangedIntro' },
  NOT_ACCEPTED: { title: 'notAcceptedTitle', intro: 'notAcceptedIntro' },
  UNKNOWN: { title: 'notAcceptedTitle', intro: 'notAcceptedUnknownReasonIntro' }
};

// The steps to follow at home, numbered, on a card
const Steps = ({ ids }) => (
  <div class={authStyle.mobileCard}>
    <ol class={authStyle.mobileStepList}>
      {ids.map(id => (
        <li key={id}>
          <span>
            <MarkupText id={`gatewayLinkUser.${id}`} />
          </span>
        </li>
      ))}
    </ol>
  </div>
);

/**
 * @description Linking a Gladys Plus account to a Gladys user on a phone
 * (docs/specs/mobile-pages/auth.md, D.9): one of three screens — the instance is not connected
 * yet, the user is not authorized on it, or the user to pick — each with its one action in the
 * bottom bar. Same props as the desktop card.
 */
const MobileLinkGatewayUser = props => {
  const noInstanceFound = props.usersGetStatus === RequestStatus.GatewayNoInstanceFound;
  const notAccepted = props.errorNotAcceptedLocally && !noInstanceFound;
  const selectUser = !noInstanceFound && !notAccepted;
  const notAcceptedTexts =
    NOT_ACCEPTED_LOCALLY_TEXTS[props.notAcceptedLocallyReason] || NOT_ACCEPTED_LOCALLY_TEXTS.UNKNOWN;
  let barError = null;
  if (props.error) {
    barError = <Text id="gatewayLinkUser.error" />;
  } else if (props.usersGetStatus === RequestStatus.Error) {
    barError = <Text id="httpErrors.unknownError" />;
  } else if (notAccepted && props.stillNotAcceptedLocally) {
    barError = <Text id="gatewayLinkUser.stillNotAccepted" />;
  }
  return (
    <MobileAuthLayout titleId="gatewayTwoFactorAuth.title" dataCy="link-gateway-user-mobile">
      {noInstanceFound && (
        <div data-cy="link-gateway-user-no-instance">
          <MobileAuthTitle lead={<Text id="gatewayLinkUser.noInstanceFoundIntro" />}>
            <Text id="gatewayLinkUser.noInstanceFoundTitle" />
          </MobileAuthTitle>
          <Steps
            ids={[
              'noInstanceFoundStepOpenLocalInstance',
              'noInstanceFoundStepGoToSettings',
              'noInstanceFoundStepLogin',
              'noInstanceFoundStepAcceptUser',
              'noInstanceFoundStepComeBack'
            ]}
          />
          <div class={kitStyle.footnote}>
            <MarkupText id="gatewayLinkUser.noInstanceFoundTutorialLink" />
          </div>
          <div class={kitStyle.footnote}>
            <MarkupText id="gatewayLinkUser.noInstanceFoundNote" />
          </div>
        </div>
      )}
      {notAccepted && (
        <div data-cy="link-gateway-user-not-accepted">
          <MobileAuthTitle lead={<Text id={`gatewayLinkUser.${notAcceptedTexts.intro}`} />}>
            <Text id={`gatewayLinkUser.${notAcceptedTexts.title}`} />
          </MobileAuthTitle>
          <MobileNotice icon="info">
            <Text id="gatewayLinkUser.notAcceptedAskAdmin" />
          </MobileNotice>
          <Steps
            ids={[
              'noInstanceFoundStepOpenLocalInstance',
              'notAcceptedStepGoToUsers',
              'notAcceptedStepAcceptUser',
              'noInstanceFoundStepComeBack'
            ]}
          />
          {props.keysFingerprints && (
            <div>
              <MobileSectionHeader title={<Text id="gatewayLinkUser.notAcceptedFingerprintsLabel" />} />
              <MobileGroup>
                <MobileRow
                  title={<Text id="gatewayLinkUser.rsaKeyFingerprint" />}
                  subtitle={<code class={style.fingerprint}>{props.keysFingerprints.rsaPublicKey}</code>}
                />
                <MobileRow
                  title={<Text id="gatewayLinkUser.ecdsaKeyFingerprint" />}
                  subtitle={<code class={style.fingerprint}>{props.keysFingerprints.ecdsaPublicKey}</code>}
                />
              </MobileGroup>
            </div>
          )}
          <div class={kitStyle.footnote}>
            <MarkupText id="gatewayLinkUser.noInstanceFoundTutorialLink" />
          </div>
        </div>
      )}
      {selectUser && (
        <div data-cy="link-gateway-user-select">
          <MobileAuthTitle lead={<Text id="gatewayLinkUser.description" />}>
            <Text id="gatewayLinkUser.title" />
          </MobileAuthTitle>
          <MobileField label={<Text id="gatewayLinkUser.label" />} htmlFor="link-gateway-user">
            <select
              id="link-gateway-user"
              class={fieldClass.select}
              onChange={props.selectUser}
              data-cy="link-gateway-user-select-user"
            >
              <option>
                <Text id="global.emptySelectOption" />
              </option>
              {props.users &&
                props.users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstname}
                  </option>
                ))}
            </select>
          </MobileField>
        </div>
      )}
      <MobileSectionHeader title={<Text id="gatewayLinkUser.mobile.accountTitle" />} />
      <MobileGroup>
        <MobileRow
          icon="credit-card"
          iconTone="neutral"
          title={<Text id="gatewayLinkUser.manageBillingLink" />}
          onClick={props.openStripeBilling}
          dataCy="link-gateway-user-billing"
        />
        <MobileRow
          icon="log-out"
          iconTone="neutral"
          title={<Text id="gatewayLinkUser.logoutButton" />}
          onClick={props.logout}
          chevron={false}
          dataCy="link-gateway-user-logout"
        />
      </MobileGroup>
      <MobileAuthBar error={barError}>
        {noInstanceFound && (
          <BigButton
            variant="primary"
            icon="refresh-cw"
            onClick={props.retry}
            loading={props.loading}
            data-cy="link-gateway-user-retry"
          >
            <Text id="gatewayLinkUser.noInstanceFoundRetryButton" />
          </BigButton>
        )}
        {notAccepted && (
          <BigButton
            variant="primary"
            icon="refresh-cw"
            onClick={props.retry}
            loading={props.loading}
            data-cy="link-gateway-user-retry"
          >
            <Text id="gatewayLinkUser.notAcceptedRetryButton" />
          </BigButton>
        )}
        {selectUser && (
          <BigButton
            variant="primary"
            onClick={props.saveUser}
            loading={props.loading}
            disabled={props.usersGetStatus !== RequestStatus.Success}
            data-cy="link-gateway-user-save"
          >
            <Text id="gatewayLinkUser.saveButton" />
          </BigButton>
        )}
      </MobileAuthBar>
    </MobileAuthLayout>
  );
};

export default MobileLinkGatewayUser;
