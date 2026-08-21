import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const WARNING_DAYS_THRESHOLD = 7;

// Gladys Plus trial countdown, shown in the sidebar while the account is in
// its trial period (gatewayTrialDaysLeft is only set in that case). When no
// payment method is configured yet, a call-to-action opens the Stripe
// customer portal so the user can add their card before the trial ends.
const GatewayTrialIndicator = ({ daysLeft, hasPaymentMethod, stripePortalKey, session }) => {
  if (!Number.isInteger(daysLeft)) {
    return null;
  }
  const openStripePortal = e => {
    e.preventDefault();
    window.open(`${session.gladysGatewayApiUrl}/accounts/stripe_customer_portal/${stripePortalKey}`);
  };
  return (
    <div
      class={cx(style.trialCard, { [style.trialCardWarning]: daysLeft <= WARNING_DAYS_THRESHOLD })}
      data-cy="gateway-trial-indicator"
    >
      <a href="/dashboard/settings/billing" class={style.trialDaysLeft}>
        <i class={cx('fe fe-clock', style.trialIcon)} />
        <span>
          <Text id="header.trialDaysLeft" plural={daysLeft} fields={{ count: daysLeft }} />
        </span>
      </a>
      {!hasPaymentMethod &&
        (stripePortalKey ? (
          <a href="#" onClick={openStripePortal} class={style.trialCta}>
            <Text id="header.trialAddPaymentMethod" /> <i class="fe fe-external-link" />
          </a>
        ) : (
          <a href="/dashboard/settings/billing" class={style.trialCta}>
            <Text id="header.trialAddPaymentMethod" />
          </a>
        ))}
    </div>
  );
};

export default GatewayTrialIndicator;
