import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import config from '../../../config';
import { RequestStatus } from '../../../utils/consts';
import { GLADYS_PLUS_BILLING_URL } from '../../../components/header/GatewaySubscriptionNotice';

// Gladys Plus answered "payment required" to the instance: backups, Enedis sync
// and AI are paused locally. The admin updates the payment method in the Stripe
// portal (reachable at any time), then asks the instance to check again — the
// instance also checks by itself once a day, and unlocks as soon as it is paid.
const GatewaySubscriptionPaymentRequired = props => (
  <div class="alert alert-danger" data-cy="gateway-subscription-payment-required">
    <h4>
      <Text id="gateway.subscriptionPaymentRequiredTitle" />
    </h4>
    <p>
      <Text id="gateway.subscriptionPaymentRequiredText" />
    </p>
    {props.gatewayRefreshSubscriptionStatus === RequestStatus.Success &&
      get(props, 'gatewayStatus.subscription_active') === false && (
        <p class="font-weight-bold">
          <Text id="gateway.subscriptionStillNotPaid" />
        </p>
      )}
    {props.gatewayRefreshSubscriptionStatus === RequestStatus.Error && (
      <p class="font-weight-bold">
        <Text id="gateway.subscriptionCheckError" />
      </p>
    )}
    <div class="d-flex flex-wrap">
      <a
        href={GLADYS_PLUS_BILLING_URL}
        target={config.gatewayMode ? undefined : '_blank'}
        rel={config.gatewayMode ? undefined : 'noopener noreferrer'}
        class="btn btn-primary mr-2 mb-2"
      >
        <Text id="gateway.subscriptionOpenBilling" />
        {!config.gatewayMode && <i class="fe fe-external-link ml-1" />}
      </a>
      <button
        type="button"
        class={cx('btn btn-secondary mb-2', {
          'btn-loading': props.gatewayRefreshSubscriptionStatus === RequestStatus.Getting
        })}
        onClick={props.refreshSubscriptionStatus}
        disabled={props.gatewayRefreshSubscriptionStatus === RequestStatus.Getting}
        data-cy="gateway-subscription-check-again"
      >
        <Text id="gateway.subscriptionCheckAgain" />
      </button>
    </div>
  </div>
);

const GatewayConfigured = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="gateway.instanceConfiguredTitle" />
      </h3>
    </div>
    <div class="card-body">
      {get(props, 'gatewayStatus.subscription_active') === false && <GatewaySubscriptionPaymentRequired {...props} />}
      {!get(props, 'gatewayStatus.connected') && (
        <div class="alert alert-warning">
          <Text id="gateway.yourGatewayIsNotConnected" />
        </div>
      )}
      <p>
        <Text id="gateway.yourGatewayIsConfigured" />
      </p>
      <div class="form-group">
        <label class="form-label">
          <Text id="gateway.instanceRsaKey" />
        </label>
        <input type="text" class="form-control" disabled value={get(props, 'gatewayInstanceKeys.rsa_fingerprint')} />
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="gateway.instanceEcdsaKey" />
        </label>
        <input type="text" class="form-control" disabled value={get(props, 'gatewayInstanceKeys.ecdsa_fingerprint')} />
      </div>
    </div>
  </div>
);

export default GatewayConfigured;
