import { Text } from 'preact-i18n';
import cx from 'classnames';
import { USER_ROLE } from '../../../../server/utils/constants';
import config from '../../config';
import style from './style.css';

// Where the Stripe customer portal is reachable from. On Gladys Plus the
// billing page is part of this very front; served locally, the instance knows
// nothing about Stripe, so the user is sent to the Gladys Plus dashboard.
export const GLADYS_PLUS_BILLING_URL = config.gatewayMode
  ? '/dashboard/settings/billing'
  : 'https://plus.gladysassistant.com/dashboard/settings/billing';

// Displayed on every page, as soon as Gladys Plus answered "payment required"
// to the instance: backups, Enedis sync and AI are paused locally until the
// subscription is paid, and the user must see it right away rather than
// discover it through a missing backup weeks later. The admin gets the way to
// fix it (update the payment method in the Stripe portal, then ask the
// instance to check again from the Gladys Plus settings).
const GatewaySubscriptionNotice = ({ user }) => (
  <div class={cx(style.updateNoticeCard, style.subscriptionNoticeCard)} data-cy="gateway-subscription-notice">
    <div class={style.updateNoticeTitle}>
      <i class={cx('fe fe-alert-triangle', style.subscriptionNoticeIcon)} />
      <span>
        <Text id="header.subscriptionNoticeTitle" />
      </span>
    </div>
    <div class={style.updateNoticeText}>
      <Text id="header.subscriptionNoticeText" />
    </div>
    {user.role === USER_ROLE.ADMIN ? (
      <div class={style.updateNoticeText}>
        <a
          href={GLADYS_PLUS_BILLING_URL}
          target={config.gatewayMode ? undefined : '_blank'}
          rel={config.gatewayMode ? undefined : 'noopener noreferrer'}
          class={style.subscriptionNoticeCta}
        >
          <Text id="header.subscriptionNoticeButton" />
          {!config.gatewayMode && <i class="fe fe-external-link ml-1" />}
        </a>
        <a href="/dashboard/settings/gateway" class={style.subscriptionNoticeCta}>
          <Text id="header.subscriptionNoticeCheck" />
        </a>
      </div>
    ) : (
      <div class={style.updateNoticeText}>
        <Text id="header.subscriptionNoticeContactAdmin" />
      </div>
    )}
  </div>
);

export default GatewaySubscriptionNotice;
