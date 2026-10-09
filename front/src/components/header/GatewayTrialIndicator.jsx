import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const WARNING_DAYS_THRESHOLD = 7;

// Gladys Plus trial countdown, displayed in the sidebar while the account is
// in its trial period. When no payment method is configured yet, a
// call-to-action opens the Stripe customer portal so the user can add their
// card before the trial ends.
// Only mounted when there is a trial to display (see the header): the
// visibility listener below then lives exactly as long as that card does.
class GatewayTrialIndicator extends Component {
  // The Stripe portal opens in another tab: coming back is the moment the card
  // may have just been added, and the moment this reminder must stop nagging.
  handleVisibilityChange = () => {
    if (!document.hidden) {
      this.props.refreshGatewayTrialState();
    }
  };

  componentDidMount() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  render({ daysLeft, hasPaymentMethod, stripePortalKey, session }) {
    const stripePortalUrl =
      stripePortalKey && `${session.gladysGatewayApiUrl}/accounts/stripe_customer_portal/${stripePortalKey}`;
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
          (stripePortalUrl ? (
            <a href={stripePortalUrl} target="_blank" rel="noopener noreferrer" class={style.trialCta}>
              <Text id="header.trialAddPaymentMethod" /> <i class="fe fe-external-link" />
            </a>
          ) : (
            <a href="/dashboard/settings/billing" class={style.trialCta}>
              <Text id="header.trialAddPaymentMethod" />
            </a>
          ))}
      </div>
    );
  }
}

export default GatewayTrialIndicator;
